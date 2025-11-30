import { Router } from 'express';
import { sanitizeProductoInput, findAll, findOne, add, update, remove, countStock, rutaUpload, findByNameStart, findByCategoriaStart, subirImagenProducto,deleteImagenProducto } from './producto.controler.js';

export const productoRouter = Router();


productoRouter.get("/", findAll);
productoRouter.get("/buscar", findByNameStart);
productoRouter.get("/categoria", findByCategoriaStart);
productoRouter.get("/stock/total", countStock);
productoRouter.get("/:id", findOne);
productoRouter.post("/", sanitizeProductoInput, add);
productoRouter.put("/:id", rutaUpload, sanitizeProductoInput, update);
productoRouter.patch('/:id', rutaUpload, sanitizeProductoInput, update);
productoRouter.delete("/:id", remove);
productoRouter.post("/:id/imagen", rutaUpload, subirImagenProducto);
productoRouter.delete("/:id/imagen", deleteImagenProducto);