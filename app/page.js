import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';

/**
 * Root ("/") never renders content - it only decides where to send the
 * visitor. A server-side redirect (rather than the previous client-side
 * router.push) means crawlers get a real 307 straight to the canonical
 * destination instead of indexing an empty spinner shell.
 *
 * lib/db is imported dynamically, only on the authenticated path. It opens
 * a MongoClient connection at module load, and this route's most common
 * visitor by far (anonymous crawlers, first-time visitors, logged-out
 * users) never needs the database at all - a static top-level import here
 * would force every cold serverless invocation to pay for Mongo connection
 * setup before it could even issue the redirect (this measurably showed up
 * as inflated TTFB on this specific route).
 */
export default async function Home() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = decodeSession(token);

  if (!session) redirect('/landing');

  const [{ getCollection }, { COLLECTIONS }] = await Promise.all([
    import('@/lib/db'),
    import('@/lib/db/schemas'),
  ]);
  const usersCol = await getCollection(COLLECTIONS.USERS);
  const user = await usersCol.findOne({ id: session.id }, { projection: { onboarded: 1 } });

  redirect(user?.onboarded ? '/dashboard' : '/onboarding');
}
