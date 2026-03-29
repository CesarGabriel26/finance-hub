import { getKeywords } from "./getKeywords.js";
import { addKeyword } from "./addKeyword.js";
import { updateKeyword } from "./updateKeyword.js";
import { deleteKeyword } from "./deleteKeyword.js";

export default {
    "get-keywords": getKeywords,
    "add-keyword": addKeyword,
    "update-keyword": updateKeyword,
    "delete-keyword": deleteKeyword
};
