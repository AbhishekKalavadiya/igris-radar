import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';

/**
 * Root ("/") never renders content — it only decides where to send the
 * visitor. A server-side redirect (rather than the previous client-side
 * router.push) means crawlers get a real 307 straight to the canonical
 * destination instead of indexing an empty spinner shell.
 */
export default async function Home() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = decodeSession(token);

  if (!session) redirect('/landing');

  const usersCol = await getCollection(COLLECTIONS.USERS);
  const user = await usersCol.findOne({ id: session.id }, { projection: { onboarded: 1 } });

  redirect(user?.onboarded ? '/dashboard' : '/onboarding');
}
