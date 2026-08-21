
import { SearchContacts } from "../controllers/ContactsController.js";
import { verifyToken } from "../middlewares/AuthMiddleware.js";
import { Router } from "express";

const ContactRoutes = Router(); 

ContactRoutes.post("/search", verifyToken, SearchContacts);

export default ContactRoutes