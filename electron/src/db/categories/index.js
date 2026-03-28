import { getCategories } from "./getCategories.js";
import { addCategory } from "./addCategory.js";
import { deleteCategory } from "./deleteCategory.js";
import { updateCategory } from "./updateCategory.js";

export default {
    "get-categories": getCategories,
    "add-category": addCategory,
    "delete-category": deleteCategory,
    "update-category": updateCategory
};
