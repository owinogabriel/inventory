"use server";

import z from "zod";
// server action for deletingProducts && CreateProduct

import { getCurrentUser } from "../auth";
import { prisma } from "../prisma";
import { redirect } from "next/navigation";

const ProductSchema = z.object({
  name:z.string().min(1, "Name is requird"),
  price:z.coerce.number().nonnegative("Price must be non-negative"),
  quantity:z.coerce.number().int().min(0, "Quantity must be non-negative"),
  sku:z.string().optional(),
  lowStockAt:z.coerce.number().int().min(0).optional(),
})


export async function deleteProduct(formData: FormData) {
  const user = await getCurrentUser();
  const id = String(formData.get("id") || "");

  await prisma.product.deleteMany({
    where: { id: id, userId: user.id },
  });
}


export async function createProduct(formData: FormData) {
  const user = await getCurrentUser();
  const parsed = ProductSchema.safeParse({
    name:formData.get("name"),
    price:formData.get("price"),
    quantity:formData.get("quantity"),
    sku:formData.get("sku") || undefined,
  });

  if(!parsed.success){
    throw new Error("Validation failed")
  }
  try{
await prisma.product.create({
  data:{...parsed.data, userId:user.id},
});
redirect("/inventory");
  }catch(error){
throw new Error("Failed to create product")
  }
}
