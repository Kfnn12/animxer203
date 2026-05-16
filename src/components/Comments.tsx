import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { formatDistanceToNow } from 'date-fns';
import { UserCircle, LogOut, Send, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface CommentProps {
  episodeId: string;
}

interface CommentData {
  id: string;
  episodeId: string;
  userId: string;
  userDisplayName: string;
  text: string;
  createdAt: any;
  updatedAt: any;
}

export default function Comments({ episodeId }: CommentProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [user, setUser] = useState<any>(null);
  const [newComment, setNewComment] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editext, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    if (!episodeId) return;

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef, 
      where('episodeId', '==', episodeId),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentData[];
      setComments(fetchedComments);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'comments');
      setError('Failed to load comments');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [episodeId]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || newComment.length > 2000) return;

    try {
      await addDoc(collection(db, 'comments'), {
        episodeId,
        userId: user.uid,
        userDisplayName: user.displayName || 'Anonymous',
        text: newComment.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  const handleUpdateComment = async (commentId: string) => {
    if (!user || !editext.trim() || editext.length > 2000) return;

    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        text: editext.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingId(null);
      setEditText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `comments/${commentId}`);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await deleteDoc(doc(db, 'comments', commentId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${commentId}`);
    }
  };

  const startEdit = (comment: CommentData) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  };

  return (
    <div className="mt-8 bg-black/40 border border-white/10 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          Discussion 
          <span className="bg-indigo-500/20 text-indigo-400 text-sm py-0.5 px-2 rounded-full border border-indigo-500/30">
            {comments.length}
          </span>
        </h3>
        {!user ? (
          <button 
            onClick={handleLogin}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors border border-white/10"
          >
            <UserCircle className="w-4 h-4" /> Sign In to Comment
          </button>
        ) : (
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/70 hidden sm:inline-block">
              {user.displayName}
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-medium py-2 px-3 rounded-xl transition-colors border border-red-500/20"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        )}
      </div>

      {user && (
        <form onSubmit={handleAddComment} className="mb-8 relative">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this episode..."
            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 min-h-[100px] resize-y pb-12"
            maxLength={2000}
          />
          <div className="absolute bottom-3 right-3 flex items-center gap-3">
             <span className={`text-xs ${newComment.length > 1900 ? 'text-red-400' : 'text-white/40'}`}>
                {newComment.length}/2000
             </span>
             <button
              type="submit"
              disabled={!newComment.trim()}
              className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white text-sm font-bold py-2 px-4 rounded-lg transition-colors"
             >
               <Send className="w-4 h-4" /> Post
             </button>
          </div>
        </form>
      )}

      {error ? (
        <div className="flex items-center gap-2 text-red-400 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-10 text-white/50 bg-white/5 rounded-xl border border-white/5 border-dashed">
          No comments yet. Be the first to start the discussion!
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/5 border border-white/10 rounded-xl p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 font-bold flex items-center justify-center border border-indigo-500/30 uppercase">
                      {comment.userDisplayName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white/90">
                        {comment.userDisplayName}
                      </h4>
                      <p className="text-xs text-white/40">
                        {formatTime(comment.createdAt)}
                        {comment.updatedAt && comment.updatedAt.toMillis && comment.createdAt && comment.createdAt.toMillis && comment.updatedAt.toMillis() > comment.createdAt.toMillis() + 1000 && (
                          <span className="ml-1 italic text-white/30">(edited)</span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {user && user.uid === comment.userId && (
                    <div className="flex gap-1 opactiy-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {editingId !== comment.id && (
                        <button 
                          onClick={() => startEdit(comment)}
                          className="p-1.5 text-white/50 hover:text-indigo-400 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => handleDeleteComment(comment.id)}
                        className="p-1.5 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editingId === comment.id ? (
                  <div className="mt-3">
                    <textarea
                      value={editext}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full bg-black/40 border border-white/20 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-indigo-500 min-h-[80px]"
                    />
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => { setEditingId(null); setEditText(''); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button
                        onClick={() => handleUpdateComment(comment.id)}
                        disabled={!editext.trim()}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-lg transition-colors"
                      >
                        <Send className="w-4 h-4" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white/80 text-sm whitespace-pre-wrap ml-11">
                    {comment.text}
                  </p>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
