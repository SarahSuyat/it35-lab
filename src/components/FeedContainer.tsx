import { useState, useEffect } from 'react';
import {
  IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton, IonInput,
  IonLabel, IonModal, IonFooter, IonCard, IonCardContent, IonCardHeader, IonCardSubtitle,
  IonCardTitle, IonAlert, IonText, IonAvatar, IonCol, IonGrid, IonRow, IonIcon,
  IonPopover, IonSpinner, IonToast, IonTextarea
} from '@ionic/react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../utils/supabaseClient';
import { heart, star, ellipsisVertical, brush } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';

interface Post {
  post_id: string;
  user_id: number;
  username: string;
  avatar_url: string;
  post_content: string;
  post_created_at: string;
  post_updated_at: string;
}

const FeedContainer = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [postContent, setPostContent] = useState('');
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [popoverState, setPopoverState] = useState<{ open: boolean; event: Event | null; postId: string | null }>({ open: false, event: null, postId: null });
  const [isLoading, setIsLoading] = useState(true);
  const [heartedPosts, setHeartedPosts] = useState<string[]>([]);
  const history = useHistory();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (authData?.user) {
        setUser(authData.user);
        const { data: userData } = await supabase
          .from('users')
          .select('user_id, username, user_avatar_url')
          .eq('user_email', authData.user.email)
          .single();
        if (userData) {
          setUser({ ...authData.user, id: userData.user_id });
          setUsername(userData.username);
        }
      }
    };

    const fetchPosts = async () => {
      const { data } = await supabase.from('posts').select('*').order('post_created_at', { ascending: false });
      setPosts(data || []);
    };

    (async () => {
      await fetchUser();
      await fetchPosts();
      setIsLoading(false);
    })();
  }, []);

  const createPost = async () => {
    if (!postContent.trim() || !user || !username) return;

    const { data: userData } = await supabase
      .from('users')
      .select('user_avatar_url')
      .eq('user_id', user.id)
      .single();

    const avatarUrl = userData?.user_avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg';

    const { data } = await supabase
      .from('posts')
      .insert([{ post_content: postContent, user_id: user.id, username, avatar_url: avatarUrl }])
      .select('*');

    if (data) {
      setPosts([data[0], ...posts]);
      setToastMessage('Craft shared successfully!');
      setPostContent('');
    }
  };

  const deletePost = async (post_id: string) => {
    await supabase.from('posts').delete().match({ post_id });
    setPosts(posts.filter(post => post.post_id !== post_id));
    setToastMessage('Craft deleted!');
  };

  const startEditingPost = (post: Post) => {
    setEditingPost(post);
    setPostContent(post.post_content);
    setIsModalOpen(true);
  };

  const savePost = async () => {
    if (!postContent || !editingPost) return;
    const { data } = await supabase
      .from('posts')
      .update({ post_content: postContent })
      .match({ post_id: editingPost.post_id })
      .select('*');

    if (data) {
      const updatedPost = data[0];
      setPosts(posts.map(p => (p.post_id === updatedPost.post_id ? updatedPost : p)));
      setEditingPost(null);
      setPostContent('');
      setIsModalOpen(false);
      setToastMessage('Craft updated!');
    }
  };

  const handleFavorite = async (post: Post) => {
    if (!user) return;

    await supabase.from('favorites').insert([
      {
        user_id: user.id,
        post_id: post.post_id,
        post_content: post.post_content,
        username: post.username,
        avatar_url: post.avatar_url,
      }
    ]);
    setToastMessage('Added to Favorites!');
    history.push('/favorites');
  };

  const handleHeart = (postId: string) => {
    if (heartedPosts.includes(postId)) {
      setHeartedPosts(heartedPosts.filter(id => id !== postId)); // Unheart
    } else {
      setHeartedPosts([...heartedPosts, postId]); // Heart
      setToastMessage('You hearted this craft!');
    }
  };

  return (
    <>
      <IonContent fullscreen className="ion-padding">
        {user ? (
          <>
            <IonCard>
              <IonCardHeader>
                <IonCardTitle>Share Your Craft 🎨</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <IonGrid>
                  <IonRow>
                    <IonCol size="auto">
                      <IonAvatar>
                        <img alt="avatar" src={user.user_metadata?.avatar_url || 'https://ionicframework.com/docs/img/demos/avatar.svg'} />
                      </IonAvatar>
                    </IonCol>
                    <IonCol>
                      <IonTextarea
                        value={postContent}
                        onIonChange={e => setPostContent(e.detail.value!)}
                        placeholder="Describe your craft project or idea..."
                        autoGrow
                      />
                    </IonCol>
                    <IonCol size="auto" className="ion-align-self-end">
                      <IonButton onClick={createPost}>
                        <IonIcon icon={brush} />
                      </IonButton>
                    </IonCol>
                  </IonRow>
                </IonGrid>
              </IonCardContent>
            </IonCard>

            {isLoading ? (
              <IonSpinner name="crescent" />
            ) : (
              posts.map(post => (
                <IonCard key={post.post_id}>
                  <IonCardHeader>
                    <IonRow>
                      <IonCol size="auto">
                        <IonAvatar>
                          <img src={post.avatar_url} alt={post.username} />
                        </IonAvatar>
                      </IonCol>
                      <IonCol>
                        <IonCardTitle>{post.username}</IonCardTitle>
                        <IonCardSubtitle>{new Date(post.post_created_at).toLocaleString()}</IonCardSubtitle>
                      </IonCol>
                      <IonCol size="auto">
                        <IonButton
                          fill="clear"
                          onClick={e => setPopoverState({ open: true, event: e.nativeEvent, postId: post.post_id })}
                        >
                          <IonIcon icon={ellipsisVertical} />
                        </IonButton>
                      </IonCol>
                    </IonRow>
                  </IonCardHeader>

                  <IonCardContent>
                    <IonText>
                      <p>{post.post_content}</p>
                    </IonText>

                    <IonRow className="ion-justify-content-center ion-padding-vertical">
                      <IonButton fill="clear" onClick={() => handleFavorite(post)}>
                        <IonIcon icon={star} />
                      </IonButton>

                      <IonButton
                        fill="clear"
                        color={heartedPosts.includes(post.post_id) ? 'danger' : 'medium'}
                        onClick={() => handleHeart(post.post_id)}
                      >
                        <IonIcon icon={heart} />
                      </IonButton>
                    </IonRow>
                  </IonCardContent>

                  <IonPopover
                    isOpen={popoverState.open && popoverState.postId === post.post_id}
                    event={popoverState.event}
                    onDidDismiss={() => setPopoverState({ open: false, event: null, postId: null })}
                  >
                    <IonButton fill="clear" onClick={() => { startEditingPost(post); setPopoverState({ open: false, event: null, postId: null }); }}>
                      Edit
                    </IonButton>
                    <IonButton fill="clear" color="danger" onClick={() => { deletePost(post.post_id); setPopoverState({ open: false, event: null, postId: null }); }}>
                      Delete
                    </IonButton>
                  </IonPopover>
                </IonCard>
              ))
            )}
          </>
        ) : (
          <IonSpinner name="dots" />
        )}
      </IonContent>

      <IonModal isOpen={isModalOpen} onDidDismiss={() => setIsModalOpen(false)}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Edit Your Craft ✏️</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <IonTextarea
            value={postContent}
            onIonChange={e => setPostContent(e.detail.value!)}
            placeholder="Update your craft project description..."
            autoGrow
          />
        </IonContent>
        <IonFooter className="ion-padding">
          <IonButton expand="block" onClick={savePost}>
            Save
          </IonButton>
          <IonButton expand="block" fill="outline" onClick={() => setIsModalOpen(false)}>
            Cancel
          </IonButton>
        </IonFooter>
      </IonModal>

      <IonToast
        isOpen={!!toastMessage}
        onDidDismiss={() => setToastMessage('')}
        message={toastMessage}
        duration={2000}
      />
    </>
  );
};

export default FeedContainer;
