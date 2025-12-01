// src/producto/producto.route.ts
import { Router } from "express";
import {sanitizeProductoInput, findAll, findOne, add, update, remove, countStock,
findByNameStart, findByCategoriaStart} from "./producto.controler.js";

export const productoRouter = Router();

productoRouter.get("/", findAll);
productoRouter.get("/:id", findOne);
productoRouter.post("/", sanitizeProductoInput, add);
productoRouter.put("/:id", sanitizeProductoInput, update);
productoRouter.delete("/:id", remove);
productoRouter.get("/stocktotal", countStock);
productoRouter.get("/buscar", findByNameStart);
productoRouter.get("/buscar-categoria", findByCategoriaStart);
