import { Router } from "express";
import { createCategory, deleteCategory, getAllCategories, getCategoryById, getCategoryBySlug, getCategoryTree, toggleCategoryStatus, updateCategory } from "../../controllers/admin/category.controller.js";
import { getActiveCategories } from "../../controllers/category.controller.js";


const router = Router();



router.post("/createCategory",createCategory);
router.get("/getAllCategories",getAllCategories);
router.get("/getCategory/:id",getCategoryById);
router.get("/getCategoryBySlug/:slug",getCategoryBySlug)
router.put("/updateCategory/:id",updateCategory);
router.put("/toggleStatusCategory/:id",toggleCategoryStatus);
router.delete("/deleteCategory",deleteCategory)
router.get("/getCategoryTree",getCategoryTree)
router.get("/getActiveCategories",getActiveCategories)



export default router;