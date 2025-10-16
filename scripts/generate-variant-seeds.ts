/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* scripts/generate-variant-seeds.ts
 * Run: npx ts-node scripts/generate-variant-seeds.ts
 * Yêu cầu: có sẵn categorySeed, productSeed, attributeCategorySeed đúng như bạn đã gửi.
 */

import * as fs from "fs";
import * as path from "path";
import { productSeed } from "../src/modules/seeding/data/product.data";
import { attributeCategorySeed } from "../src/modules/seeding/data/attribute.data";

// ==== IMPORT các seed gốc của bạn (đường dẫn chỉnh lại đúng project của bạn) ====

// ======= Types khớp entity của bạn (đơn giản hóa) =======
type VariantOut = {
  product: { id: number };  // map theo index productSeed
  imageUrl: string;
  publicId: string;
  quantity: number;
  remaining: number;
  isActive: boolean;
};

type VariantAttrOut = {
  // Liên kết bằng khóa mềm — sẽ resolve sang attributeCategoryId khi seeding
  // vì attribute_categories id chỉ có sau khi bạn save attributeCategorySeed.
  variantIndex: number; // index trong mảng productVariantSeed xuất ra (1-based)
  productId: number;    // id product (1-based theo thứ tự productSeed)
  categoryKey: string;
  attributeKey: string;
  value: string;
};

// ======= Build map: category -> { attributeKey: string[] } =======
function buildCategoryAttrMap() {
  const map = new Map<
    string,
    Map<string, string[]>
  >();

  for (const row of attributeCategorySeed) {
    const cat = row.categoryKey!;
    const attr = row.attributeKey!;
    const values = (row.value ?? "").split(",").map(s => s.trim()).filter(Boolean);
    if (!cat || !attr || values.length === 0) continue;

    if (!map.has(cat)) map.set(cat, new Map());
    const attrMap = map.get(cat)!;

    const existed = attrMap.get(attr) ?? [];
    attrMap.set(attr, [...existed, ...values]);
  }
  return map;
}

// ======= Cartesian product helper =======
function cartesian<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  return arrays.reduce<T[][]>(
    (acc, curr) => {
      const res: T[][] = [];
      for (const a of acc) {
        for (const c of curr) {
          res.push([...a, c]);
        }
      }
      return res;
    },
    [[]]
  );
}

function main() {
  const categoryAttrMap = buildCategoryAttrMap();

  // productId = index + 1 (theo đúng style bạn đang dùng trong các seed trước)
  const variants: VariantOut[] = [];
  const variantAttrValues: VariantAttrOut[] = [];

  let globalVariantIndex = 0; // 1-based index của variant trong file output

  productSeed.forEach((p, idx) => {
    const productId = idx + 1;
    const catName = (p.category as any)?.name as string;
    if (!catName) return;

    const attrMap = categoryAttrMap.get(catName);
    if (!attrMap) {
      // Category không có attribute rule => tạo 1 variant mặc định
      globalVariantIndex += 1;
      variants.push({
        product: { id: productId },
        imageUrl: "",
        publicId: "",
        quantity: 50,
        remaining: 50,
        isActive: true,
      });
      return;
    }

    // Sắp xếp attribute theo tên để tạo thứ tự ổn định (deterministic)
    const attrEntries = Array.from(attrMap.entries()).sort(([a],[b]) => a.localeCompare(b));
    // Mảng các danh sách value theo thứ tự attrEntries
    const valueArrays = attrEntries.map(([, values]) => values);

    // Sinh tất cả tổ hợp
    const combos = cartesian<string>(valueArrays);

    // Với mỗi tổ hợp => 1 variant, + các dòng variantAttributeValue
    for (const values of combos) {
      globalVariantIndex += 1;

      variants.push({
        product: { id: productId },
        imageUrl: "",
        publicId: "",
        quantity: 50,
        remaining: 50,
        isActive: true,
      });

      values.forEach((v, i) => {
        const [attributeKey] = attrEntries[i]; // theo cùng index
        variantAttrValues.push({
          variantIndex: globalVariantIndex,
          productId,
          categoryKey: catName,
          attributeKey,
          value: v,
        });
      });
    }
  });

  // ====== Ghi file output ======
  const outDir = path.join(process.cwd(), "");
  fs.mkdirSync(outDir, { recursive: true });

  const variantFile = path.join(outDir, "productVariantSeed.ts");
  const variantAttrFile = path.join(outDir, "variantAttributeValueSeed.ts");

  const variantTs = `import { ProductVariant } from "src/modules/products/entities/product-variant.entity";

export const productVariantSeed: Partial<ProductVariant>[] = ${JSON.stringify(variants, null, 2)} as any;
`;
  fs.writeFileSync(variantFile, variantTs, "utf8");

  const variantAttrTs = `// Dữ liệu trung gian: sẽ resolve sang attributeCategoryId khi seeding.
// Mỗi item là 1 cặp (variantIndex -> {categoryKey, attributeKey, value}).
// Xem hướng dẫn resolve tại seed service bên dưới.
export type VariantAttributeValueKeySeed = {
  variantIndex: number;
  productId: number;
  categoryKey: string;
  attributeKey: string;
  value: string;
};

export const variantAttributeValueKeySeed: VariantAttributeValueKeySeed[] = ${JSON.stringify(variantAttrValues, null, 2)};`;
  fs.writeFileSync(variantAttrFile, variantAttrTs, "utf8");

  console.log("✅ Generated:");
  console.log(" -", path.relative(process.cwd(), variantFile));
  console.log(" -", path.relative(process.cwd(), variantAttrFile));
}

main();
