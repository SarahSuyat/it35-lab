import { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonTextarea, IonButton, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonAvatar, IonRow, IonCol,
  IonToast, IonInput
} from '@ionic/react';
import {
  heartOutline, heart, chatbubbleOutline, image as imageIcon, createOutline, trashOutline
} from 'ionicons/icons';
import { supabase } from '../utils/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Post {
  post_id: string;
  user_id: string;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  image_url?: string;
}

interface Comment {
  post_id: any;
  user_id: string | undefined;
  comment_id: string;
  username: string;
  avatar_url: string;
  comment_text: string;
  created_at: string;
}

const FeedContainer = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [likeCounts, setLikeCounts] = useState<{ [key: string]: number }>({});
  const [comments, setComments] = useState<{ [key: string]: Comment[] }>({});
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [expandedPosts, setExpandedPosts] = useState<{ [key: string]: boolean }>({});
  const [expandedComments, setExpandedComments] = useState<{ [key: string]: boolean }>({});
  const commentInputRefs = useRef<{ [key: string]: HTMLIonInputElement | null }>({});

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) setUser(authData.user);

      const { data: postsData } = await supabase.from('posts').select('*').order('post_created_at', { ascending: false });
      setPosts(postsData || []);

      const { data: likesData } = await supabase.from('likes').select('*');
      const liked = likesData?.filter(like => like.user_id === authData?.user?.id).map(like => like.post_id) || [];
      const likeMap: { [key: string]: number } = {};
      likesData?.forEach(like => {
        likeMap[like.post_id] = (likeMap[like.post_id] || 0) + 1;
      });
      setLikedPosts(liked);
      setLikeCounts(likeMap);

      const { data: allComments } = await supabase.from('comments').select('*').order('created_at');
      const grouped: { [key: string]: Comment[] } = {};
      (allComments || []).forEach(comment => {
        if (!grouped[comment.post_id]) grouped[comment.post_id] = [];
        grouped[comment.post_id].push(comment);
      });
      setComments(grouped);
    };
    load();
  }, []);

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileName = `${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('post-images').upload(fileName, file);
    if (error) {
      console.error('Upload error:', error.message);
      return null;
    }
    const { data } = supabase.storage.from('post-images').getPublicUrl(fileName);
    return data?.publicUrl || null;
  };

  const createPost = async () => {
    if ((!postContent.trim() && !selectedImage) || !user) return;
    let imageUrl = null;
    if (selectedImage) imageUrl = await uploadImage(selectedImage);

    const { data: userInfo } = await supabase.from('users').select('*').eq('user_email', user.email).single();
    const { data } = await supabase.from('posts').insert([{
      post_content: postContent,
      user_id: userInfo.user_id,
      username: userInfo.username,
      avatar_url: userInfo.user_avatar_url,
      image_url: imageUrl
    }]).select('*');

    if (data) {
      setPosts([data[0], ...posts]);
      setToastMessage('Post shared successfully!');
      setPostContent('');
      setSelectedImage(null);
    }
  };

  const updatePost = async () => {
    if (!editingPost || !editingPost.post_content.trim()) return;
    const { data } = await supabase.from('posts').update({ post_content: editingPost.post_content }).eq('post_id', editingPost.post_id).select('*');
    if (data) {
      setPosts(posts.map(p => p.post_id === data[0].post_id ? data[0] : p));
      setEditingPost(null);
    }
  };

  const deletePost = async (postId: string) => {
    await supabase.from('posts').delete().match({ post_id: postId });
    setPosts(posts.filter(post => post.post_id !== postId));
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const { data: userInfo } = await supabase.from('users').select('user_id').eq('user_email', user.email).single();
    if (!userInfo) return;
    const alreadyLiked = likedPosts.includes(postId);
    if (alreadyLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: userInfo.user_id });
      setLikedPosts(likedPosts.filter(id => id !== postId));
      setLikeCounts({ ...likeCounts, [postId]: likeCounts[postId] - 1 });
    } else {
      await supabase.from('likes').insert([{ post_id: postId, user_id: userInfo.user_id }]);
      setLikedPosts([...likedPosts, postId]);
      setLikeCounts({ ...likeCounts, [postId]: (likeCounts[postId] || 0) + 1 });
    }
  };

  const addComment = async (postId: string) => {
    if (!user) return;
    const inputRef = commentInputRefs.current[postId];
    const commentText = inputRef?.value;
    if (!commentText) return;

    const { data: userInfo } = await supabase.from('users').select('user_id, username, user_avatar_url').eq('user_email', user.email).single();
    if (!userInfo) return;

    const { data } = await supabase.from('comments').insert([{
      post_id: postId,
      user_id: userInfo.user_id,
      username: userInfo.username,
      avatar_url: userInfo.user_avatar_url,
      comment_text: commentText,
    }]).select('*');

    if (data) {
      setComments({
        ...comments,
        [postId]: [...(comments[postId] || []), data[0]],
      });
      if (inputRef) inputRef.value = '';
    }
  };

  const updateComment = async () => {
    if (!editingComment || !editingComment.comment_text.trim()) return;
    const { data } = await supabase.from('comments').update({ comment_text: editingComment.comment_text }).eq('comment_id', editingComment.comment_id).select('*');
    if (data) {
      setComments({
        ...comments,
        [editingComment.post_id]: comments[editingComment.post_id].map(comment =>
          comment.comment_id === data[0].comment_id ? data[0] : comment
        ),
      });
      setEditingComment(null);
    }
  };

  const deleteComment = async (commentId: string, postId: string) => {
    await supabase.from('comments').delete().match({ comment_id: commentId });
    setComments({
      ...comments,
      [postId]: comments[postId].filter(comment => comment.comment_id !== commentId),
    });
  };

  return (
    <IonContent className="ion-padding" style={{ backgroundColor: '#121212', minHeight: '100vh' }}>
      {/* New Post Card */}
      <IonCard style={{ 
        padding: '1rem', 
        borderRadius: '15px',
        background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        marginBottom: '20px'
      }}>
        <IonCardHeader>
          <IonCardTitle style={{ 
            fontSize: '1.2rem', 
            color: '#ffffff',
            fontWeight: '600',
            textShadow: '0 1px 3px rgba(0,0,0,0.3)'
          }}>Share Something</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonTextarea
            value={postContent}
            onIonChange={e => setPostContent(e.detail.value!)}
            placeholder="What's on your mind?"
            style={{ 
              marginBottom: '15px', 
              borderRadius: '12px',
              backgroundColor: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '12px'
            }}
            rows={4}
          />
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '15px'
          }}>
            <label htmlFor="file-upload" style={{
              display: 'inline-block',
              padding: '10px 15px',
              borderRadius: '8px',
              background: 'linear-gradient(145deg, #3a3a3a, #2a2a2a)',
              color: '#ffffff',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
            }}>
              <IonIcon icon={imageIcon} style={{ marginRight: '8px' }} />
              {selectedImage ? selectedImage.name : 'Choose Image'}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={e => setSelectedImage(e.target.files?.[0] || null)}
              style={{ display: 'none' }}
            />
            
            {selectedImage && (
              <IonButton 
                fill="clear" 
                onClick={() => setSelectedImage(null)}
                style={{ color: '#ff6b6b' }}
              >
                Remove
              </IonButton>
            )}
          </div>
          
          <IonButton 
            expand="block" 
            onClick={createPost} 
            style={{
              background: 'linear-gradient(145deg, #3880ff, #4d8aff)',
              borderRadius: '8px',
              height: '45px',
              fontWeight: '600',
              boxShadow: '0 2px 10px rgba(56, 128, 255, 0.3)',
              transition: 'all 0.3s ease',
              ':active': {
                transform: 'scale(0.98)'
              }
            }}
          >
            Post
          </IonButton>
        </IonCardContent>
      </IonCard>

      {/* Posts List */}
      {posts.map(post => {
        const isExpanded = expandedPosts[post.post_id];
        const shouldTruncate = post.post_content.length > 200;
        const commentsToShow = expandedComments[post.post_id] ? comments[post.post_id] : comments[post.post_id]?.slice(0, 2) || [];

        return (
          <IonCard key={post.post_id} style={{ 
            marginTop: '1rem', 
            borderRadius: '15px', 
            background: 'linear-gradient(145deg, #1e1e1e, #2a2a2a)',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
          }}>
            <IonCardHeader>
              <IonRow className="ion-align-items-center">
                <IonCol size="auto">
                  <IonAvatar style={{ width: '40px', height: '40px' }}>
                    <img src={post.avatar_url} style={{ objectFit: 'cover' }} />
                  </IonAvatar>
                </IonCol>
                <IonCol>
                  <IonCardTitle style={{ fontSize: '1rem', color: '#ffffff' }}>{post.username}</IonCardTitle>
                  <IonCardSubtitle style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                    {new Date(post.post_created_at).toLocaleString()}
                  </IonCardSubtitle>
                </IonCol>
              </IonRow>
            </IonCardHeader>
            <IonCardContent style={{ color: '#ffffff' }}>
              {editingPost?.post_id === post.post_id ? (
                <>
                  <IonTextarea
                    value={editingPost.post_content}
                    onIonChange={e => setEditingPost({ ...editingPost, post_content: e.detail.value! })}
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      color: '#ffffff',
                      borderRadius: '8px',
                      marginBottom: '10px'
                    }}
                  />
                  <IonButton size="small" onClick={updatePost} style={{ marginRight: '8px' }}>Update</IonButton>
                  <IonButton size="small" onClick={() => setEditingPost(null)} color="medium">Cancel</IonButton>
                </>
              ) : (
                <>
                  <p>
                    {shouldTruncate && !isExpanded
                      ? post.post_content.slice(0, 200) + '...'
                      : post.post_content}
                  </p>
                  {shouldTruncate && (
                    <IonButton 
                      fill="clear" 
                      onClick={() => setExpandedPosts(prev => ({ ...prev, [post.post_id]: !isExpanded }))}
                      style={{ color: '#3880ff', fontSize: '0.8rem' }}
                    >
                      {isExpanded ? 'Show less' : 'Show more'}
                    </IonButton>
                  )}
                </>
              )}
              
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  style={{ 
                    width: '100%', 
                    borderRadius: '12px', 
                    marginTop: '10px',
                    maxHeight: '100%',
                    objectFit: 'cover'
                  }} 
                />
              )}
              
              <IonRow className="ion-align-items-center" style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <IonButton 
                  fill="clear" 
                  onClick={() => toggleLike(post.post_id)}
                  style={{ color: likedPosts.includes(post.post_id) ? '#ff6b6b' : '#ffffff' }}
                >
                  <IonIcon icon={likedPosts.includes(post.post_id) ? heart : heartOutline} />
                  <span style={{ marginLeft: '5px' }}>{likeCounts[post.post_id] || 0}</span>
                </IonButton>
                <IonButton fill="clear" style={{ color: '#ffffff' }}>
                  <IonIcon icon={chatbubbleOutline} />
                  <span style={{ marginLeft: '5px' }}>{comments[post.post_id]?.length || 0}</span>
                </IonButton>
                {user?.id === post.user_id && (
                  <>
                    <IonButton 
                      fill="clear" 
                      onClick={() => setEditingPost(post)}
                      style={{ color: '#ffffff' }}
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton 
                      fill="clear" 
                      onClick={() => deletePost(post.post_id)}
                      style={{ color: '#ff6b6b' }}
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </>
                )}
              </IonRow>

              {/* Comments Section */}
              <div style={{ 
                marginTop: '15px',
                paddingTop: '15px',
                borderTop: '1px solid rgba(255,255,255,0.1)'
              }}>
                {commentsToShow.map(comment => (
                  <IonRow key={comment.comment_id} className="ion-align-items-center" style={{ marginBottom: '10px' }}>
                    <IonCol size="auto">
                      <IonAvatar style={{ width: '32px', height: '32px' }}>
                        <img src={comment.avatar_url} style={{ objectFit: 'cover' }} />
                      </IonAvatar>
                    </IonCol>
                    <IonCol>
                      {editingComment?.comment_id === comment.comment_id ? (
                        <>
                          <IonTextarea
                            value={editingComment.comment_text}
                            onIonChange={(e) => setEditingComment({ ...editingComment, comment_text: e.detail.value! })}
                            style={{ 
                              backgroundColor: 'rgba(255,255,255,0.1)',
                              color: '#ffffff',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}
                          />
                          <IonButton size="small" onClick={updateComment} style={{ marginRight: '8px' }}>Save</IonButton>
                          <IonButton size="small" onClick={() => setEditingComment(null)} color="medium">Cancel</IonButton>
                        </>
                      ) : (
                        <>
                          <div style={{ 
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: '8px 12px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            maxWidth: '100%'
                          }}>
                            <strong style={{ color: '#ffffff', fontSize: '0.9rem' }}>{comment.username}</strong>
                            <p style={{ margin: '4px 0 0', fontSize: '0.9rem' }}>{comment.comment_text}</p>
                          </div>
                          {user?.id === comment.user_id && (
                            <div style={{ marginTop: '4px' }}>
                              <IonButton 
                                fill="clear" 
                                onClick={() => setEditingComment(comment)}
                                style={{ 
                                  color: '#3880ff',
                                  fontSize: '0.7rem',
                                  padding: '0 8px',
                                  height: '24px'
                                }}
                              >
                                Edit
                              </IonButton>
                              <IonButton 
                                fill="clear" 
                                onClick={() => deleteComment(comment.comment_id, post.post_id)}
                                style={{ 
                                  color: '#ff6b6b',
                                  fontSize: '0.7rem',
                                  padding: '0 8px',
                                  height: '24px'
                                }}
                              >
                                Delete
                              </IonButton>
                            </div>
                          )}
                        </>
                      )}
                    </IonCol>
                  </IonRow>
                ))}
                
                {comments[post.post_id]?.length > 2 && (
                  <IonButton 
                    fill="clear" 
                    onClick={() => setExpandedComments(prev => ({ ...prev, [post.post_id]: !prev[post.post_id] }))}
                    style={{ 
                      color: '#3880ff',
                      fontSize: '0.8rem',
                      marginBottom: '10px'
                    }}
                  >
                    {expandedComments[post.post_id] ? 'Hide comments' : `View all ${comments[post.post_id].length} comments`}
                  </IonButton>
                )}
                
                <IonRow className="ion-align-items-center" style={{ marginTop: '10px' }}>
                  <IonCol size="auto">
                    <IonAvatar style={{ width: '32px', height: '32px' }}>
                      <img src={user?.user_metadata?.avatar_url || ''} style={{ objectFit: 'cover' }} />
                    </IonAvatar>
                  </IonCol>
                  <IonCol>
                    <IonInput 
                      ref={el => commentInputRefs.current[post.post_id] = el} 
                      placeholder="Write a comment..." 
                      style={{ 
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '0.9rem',
                        '--placeholder-color': 'rgba(255,255,255,0.5)',
                        '--color': '#ffffff'
                      }}
                    />
                  </IonCol>
                  <IonCol size="auto">
                    <IonButton 
                      onClick={() => addComment(post.post_id)}
                      style={{ 
                        height: '32px',
                        fontSize: '0.8rem',
                        borderRadius: '20px',
                        padding: '0 12px'
                      }}
                    >
                      Post
                    </IonButton>
                  </IonCol>
                </IonRow>
              </div>
            </IonCardContent>
          </IonCard>
        );
      })}

      <IonToast
        isOpen={!!toastMessage}
        onDidDismiss={() => setToastMessage('')}
        message={toastMessage}
        duration={2000}
        color="success"
        style={{ '--background': '#4CAF50' }}
      />
    </IonContent>
  );
};

export default FeedContainer;