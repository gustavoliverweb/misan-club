import { notFound } from "next/navigation";
import { getProductByIdAdminAction } from "@/app/actions/product-actions";
import { ProductForm } from "@/components/admin/product-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductByIdAdminAction(id);
  if (!product) notFound();

  return <ProductForm mode="edit" productId={id} initialData={product} />;
}