import { Router } from 'express'
import { sanitizeProductoInput, findAll, findOne, add, update, remove, countStock, rutaUpload, subirImagenProducto, findByNameStart, findByCategoriaStart} from './producto.controler.js'

export const productoRouter = Router()
productoRouter.get('/', findAll)
productoRouter.get('/stocktotal', countStock)
productoRouter.get('/searchCat', findByCategoriaStart)
productoRouter.get('/search', findByNameStart)
productoRouter.get('/:id', findOne)
productoRouter.post('/', sanitizeProductoInput, add)
productoRouter.put('/:id', sanitizeProductoInput, update)
productoRouter.patch('/:id', sanitizeProductoInput, update)
productoRouter.delete('/:id', remove)
productoRouter.post('/:id/imagen', rutaUpload, subirImagenProducto)
