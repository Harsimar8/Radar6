import { AssetSubCategory } from './asset-subcategory';

export interface AssetCategory {

    id: string;

    name: string;

    subCategories: AssetSubCategory[];

}