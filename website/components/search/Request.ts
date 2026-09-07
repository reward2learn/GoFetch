export interface Request {
  id: string;
  title: string;
  category: string;
  outletName: string | null;
  imageUrls: string[] | null;
  invoiceUrl: string | null;
  itemPrice: number;
  maxItemPrice: number | null;
  reward: number;
  fromCountry: string;
  fromCity: string;
  toCountry: string;
  toCity: string;
  deadline: string | null;
  status: string;
  archiveReason: string | null;
  deliveryType: string;
  createdAt: string;
  buyerId: string;
  buyer: { id: string; name: string } | null;
}
