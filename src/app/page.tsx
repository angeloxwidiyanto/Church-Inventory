import { getItems } from '@/actions/inventory';
import Dashboard from '@/components/Dashboard';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const items = await getItems();

  return <Dashboard initialItems={items} />;
}
