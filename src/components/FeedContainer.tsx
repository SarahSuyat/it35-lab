import { useState, useEffect, useRef } from 'react';
import {
  IonContent, IonPage, IonTextarea, IonButton, IonIcon, IonCard, IonCardHeader,
  IonCardTitle, IonCardSubtitle, IonCardContent, IonAvatar, IonRow, IonCol,
  IonModal, IonHeader, IonToolbar, IonTitle, IonFooter, IonToast, IonLabel, IonInput
} from '@ionic/react';
import { heartOutline, heart, chatbubbleOutline, image as imageIcon, closeOutline, createOutline, trashOutline } from 'ionicons/icons';
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
  const commentInputRefs = useRef<{ [key: string]: HTMLIonInputElement | null }>({});

  useEffect(() => {
    const load = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
      }

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
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('post-images')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError.message);
      return null;
    }

    const { data: publicData } = supabase.storage
      .from('post-images')
      .getPublicUrl(fileName);

    if (!publicData?.publicUrl) {
      console.error('Failed to get public URL for uploaded image.');
      return null;
    }

    return publicData.publicUrl;
  };

  const createPost = async () => {
    if (!postContent.trim() || !user) return;
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
      setToastMessage('Craft shared!');
      setPostContent('');
      setSelectedImage(null);
    }
  };

  const updatePost = async () => {
    if (!editingPost || !editingPost.post_content.trim()) return;

    const { data } = await supabase.from('posts')
      .update({ post_content: editingPost.post_content })
      .eq('post_id', editingPost.post_id)
      .select('*');

    if (data) {
      setPosts(posts.map(post => (post.post_id === data[0].post_id ? data[0] : post)));
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

    const { data: userInfo } = await supabase.from('users')
      .select('user_id, username, user_avatar_url')
      .eq('user_email', user.email)
      .single();

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

    const { data } = await supabase.from('comments')
      .update({ comment_text: editingComment.comment_text })
      .eq('comment_id', editingComment.comment_id)
      .select('*');

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
    <IonContent className="ion-padding">
      {/* Create Post Section */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Share Something</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonTextarea
            value={postContent}
            onIonChange={e => setPostContent(e.detail.value!)}
            placeholder="What's on your mind?"
          />
          <input type="file" accept="image/*" onChange={e => setSelectedImage(e.target.files?.[0] || null)} />
          <IonButton onClick={createPost}>Post</IonButton>
        </IonCardContent>
      </IonCard>

      {/* Post Feed */}
      {posts.map(post => (
        <IonCard key={post.post_id} className="post-card">
          <IonCardHeader>
            <IonRow>
              <IonCol size="auto">
                <IonAvatar>
                  <img src={post.avatar_url} alt="avatar" />
                </IonAvatar>
              </IonCol>
              <IonCol>
                <IonCardTitle>{post.username}</IonCardTitle>
                <IonCardSubtitle>{new Date(post.post_created_at).toLocaleString()}</IonCardSubtitle>
              </IonCol>
            </IonRow>
          </IonCardHeader>

          <IonCardContent>
            {editingPost?.post_id === post.post_id ? (
              <IonTextarea
                value={postContent}
                onIonChange={e => setPostContent(e.detail.value!)}
              />
            ) : (
              <p>{post.post_content}</p>
            )}
            {post.image_url && <img src={post.image_url} style={{ width: '100%', borderRadius: '8px', marginTop: '10px' }} />}
            <IonRow className="ion-align-items-center">
              <IonCol size="auto">
                <IonButton fill="clear" onClick={() => toggleLike(post.post_id)}>
                  <IonIcon icon={likedPosts.includes(post.post_id) ? heart : heartOutline} />
                  <span style={{ marginLeft: '5px' }}>{likeCounts[post.post_id] || 0}</span>
                </IonButton>
              </IonCol>
              <IonCol size="auto">
                <IonButton fill="clear">
                  <IonIcon icon={chatbubbleOutline} />
                  <span style={{ marginLeft: '5px' }}>{comments[post.post_id]?.length || 0}</span>
                </IonButton>
              </IonCol>
              {user?.id === post.user_id && (
                <>
                  <IonButton fill="clear" onClick={() => setEditingPost(post)}>
                    <IonIcon icon={createOutline} />
                  </IonButton>
                  <IonButton fill="clear" onClick={() => deletePost(post.post_id)}>
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </>
              )}
            </IonRow>

            <div>
              {comments[post.post_id]?.map(comment => (
                <IonRow key={comment.comment_id} className="ion-align-items-center" style={{ marginTop: '10px' }}>
                  <IonCol size="auto">
                    <IonAvatar><img src={comment.avatar_url} alt="avatar" /></IonAvatar>
                  </IonCol>
                  <IonCol>
                    {editingComment?.comment_id === comment.comment_id ? (
                      <>
                        <IonTextarea
                          value={editingComment.comment_text}
                          onIonChange={(e) => setEditingComment({ ...editingComment, comment_text: e.detail.value! })}
                        />
                        <IonButton size="small" onClick={updateComment}>Save</IonButton>
                        <IonButton size="small" onClick={() => setEditingComment(null)}>Cancel</IonButton>
                      </>
                    ) : (
                      <>
                        <strong>{comment.username}</strong><br />
                        <span>{comment.comment_text}</span>
                        {user?.id === comment.user_id && (
                          <>
                            <IonButton fill="clear" onClick={() => setEditingComment(comment)}>
                              <IonIcon icon={createOutline} />
                            </IonButton>
                            <IonButton fill="clear" onClick={() => deleteComment(comment.comment_id, post.post_id)}>
                              <IonIcon icon={trashOutline} />
                            </IonButton>
                          </>
                        )}
                      </>
                    )}
                  </IonCol>
                </IonRow>
              ))}
              <IonRow className="ion-align-items-center" style={{ marginTop: '10px' }}>
                <IonCol size="10">
                  <IonInput ref={el => commentInputRefs.current[post.post_id] = el} placeholder="Write a comment..." />
                </IonCol>
                <IonCol size="2">
                  <IonButton onClick={() => addComment(post.post_id)}>Post</IonButton>
                </IonCol>
              </IonRow>
            </div>
          </IonCardContent>
        </IonCard>
      ))}

      <IonToast
        isOpen={!!toastMessage}
        onDidDismiss={() => setToastMessage('')}
        message={toastMessage}
        duration={2000}
      />
    </IonContent>
  );
};

export default FeedContainer;
