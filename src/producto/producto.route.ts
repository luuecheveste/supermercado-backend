import { Router } from "express";
import {sanitizeProductoInput, findAll, findOne, add, update, remove, countStock,
findByNameStart, findByCategoriaStart} from "./producto.controler.js";

export const productoRouter = Router();

productoRouter.get("/stocktotal", countStock);
productoRouter.get("/buscar", findByNameStart);
productoRouter.get("/buscar-categoria", findByCategoriaStart);

productoRouter.get("/", findAll);
productoRouter.post("/", sanitizeProductoInput, add);
productoRouter.put("/:id", sanitizeProductoInput, update);
productoRouter.delete("/:id", remove);

productoRouter.get("/:id", findOne);
