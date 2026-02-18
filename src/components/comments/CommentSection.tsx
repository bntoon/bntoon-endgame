import { useState } from "react";
import { Link } from "react-router-dom";
import { useUserAuth } from "@/hooks/useUserAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface CommentSectionProps {
  seriesId?: string;
  chapterId?: string;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  display_name: string;
}

export function CommentSection({ seriesId, chapterId }: CommentSectionProps) {
  const { user, isAuthenticated } = useUserAuth();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const queryKey = ["comments", seriesId, chapterId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      let query = supabase
        .from("comments" as any)
        .select("id, user_id, content, created_at")
        .order("created_at", { ascending: false });

      if (seriesId) query = query.eq("series_id", seriesId);
      if (chapterId) query = query.eq("chapter_id", chapterId);

      const { data, error } = await query;
      if (error) throw error;

      // Fetch display names for comment authors
      const userIds = [...new Set((data as any[]).map((c: any) => c.user_id))];
      const { data: profiles } = await supabase
        .from("user_profiles" as any)
        .select("user_id, display_name")
        .in("user_id", userIds);

      const profileMap = new Map((profiles as any[] || []).map((p: any) => [p.user_id, p.display_name]));

      return (data as any[]).map((c: any) => ({
        ...c,
        display_name: profileMap.get(c.user_id) || "Anonymous",
      })) as Comment[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (text: string) => {
      const { error } = await supabase.from("comments" as any).insert({
        user_id: user!.id,
        content: text,
        ...(seriesId ? { series_id: seriesId } : {}),
        ...(chapterId ? { chapter_id: chapterId } : {}),
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comment posted!");
    },
    onError: () => toast.error("Failed to post comment"),
  });

  const deleteComment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Comment deleted");
    },
    onError: () => toast.error("Failed to delete comment"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    addComment.mutate(content.trim());
  };

  return (
    <div className="mt-8">
      <h3 className="font-display text-lg font-bold text-foreground flex items-center gap-2 mb-4">
        <MessageCircle className="h-5 w-5" />
        Comments ({comments.length})
      </h3>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <Textarea
            placeholder="Write a comment..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mb-2 min-h-[80px]"
          />
          <Button type="submit" size="sm" disabled={addComment.isPending || !content.trim()}>
            {addComment.isPending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
            Post Comment
          </Button>
        </form>
      ) : (
        <div className="mb-6 p-4 rounded-lg bg-muted text-center">
          <p className="text-sm text-muted-foreground mb-2">Sign in to join the discussion</p>
          <Link to="/auth">
            <Button size="sm" variant="outline">Sign In</Button>
          </Link>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-card rounded-lg p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                    {comment.display_name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-foreground">{comment.display_name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                {user?.id === comment.user_id && (
                  <button
                    onClick={() => deleteComment.mutate(comment.id)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
