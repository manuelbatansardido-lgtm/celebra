export const runtime = 'edge';

import PostClient from './PostClient';

export default function Page({ params }: { params: { postId: string } }) {
  return <PostClient postId={params.postId} />;
}
