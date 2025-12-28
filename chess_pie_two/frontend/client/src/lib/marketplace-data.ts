'use server';
import { db } from '@/lib/firebase-admin';
import { MarketplaceItem } from './marketplace-types';

export async function getMarketplaceItems(): Promise<MarketplaceItem[]> {
  try {
    const snapshot = await db.collection('marketplace').get();
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as MarketplaceItem[];
  } catch (error) {
    console.error("Error fetching marketplace items:", error);
    return [];
  }
}

export async function getMarketplaceItem(id: string): Promise<MarketplaceItem | null> {
    try {
      const doc = await db.collection('marketplace').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return { id: doc.id, ...doc.data() } as MarketplaceItem;
    } catch (error) {
      console.error(`Error fetching item ${id}:`, error);
      return null;
    }
}

export async function createMarketplaceItem(item: Omit<MarketplaceItem, 'id' | 'rating' | 'reviewCount' | 'isNew' | 'createdAt'>): Promise<string> {
    try {
        const newItem = {
            ...item,
            rating: 0,
            reviewCount: 0,
            isNew: true,
            createdAt: new Date(),
        };
        const res = await db.collection('marketplace').add(newItem);
        return res.id;
    } catch (error) {
        console.error("Error creating marketplace item:", error);
        throw new Error("Failed to create item");
    }
}
