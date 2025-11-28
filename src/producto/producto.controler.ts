import { Request, Response, NextFunction } from 'express'
import { orm } from '../shared/orm.js'
import { Producto } from './producto.entity.js'
import multer from 'multer';
import fs from 'fs';

const em = orm.em

// Multer para subir imágenes
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = '../supermercado-front-js/public/imagenes/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

// Sanitizar input
function sanitizeProductoInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    descripcion: req.body.descripcion,
    precio: req.body.precio,
    stock: req.body.stock,
    imagen: req.body.imagen,
    categoria: req.body.categoria,
    estado: req.body.estado,
  }

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) {
      delete req.body.sanitizedInput[key]
    }
  })
  next()
}

// --- ENDPOINTS ---

async function findAll(req: Request, res: Response) {
  try {
    const productos = await em.find(Producto, {}, { populate: ['categoria'] })
    res.status(200).json({ message: 'found all productos', data: productos })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: 'ID inválido' });
    }
    const producto = await em.findOneOrFail(Producto, { id }, { populate: ['categoria'] })
    res.status(200).json({ message: 'found producto', data: producto })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try {
    const producto = em.create(Producto, req.body.sanitizedInput)
    await em.flush()
    res.status(201).json({ message: 'producto created', data: producto })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id)
    if (!id || isNaN(id)) return res.status(400).json({ message: 'ID inválido' })

    const productoToUpdate = await em.findOneOrFail(Producto, { id })
    em.assign(productoToUpdate, req.body.sanitizedInput)
    await em.flush()
    res.status(200).json({ message: 'producto updated', data: productoToUpdate })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) {
      return res.status(400).json({ message: "ID inválido" });
    }
    // Buscar el producto REAL en la base
    const producto = await em.findOne(Producto, { id });
    if (!producto) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    await em.removeAndFlush(producto);

    res.status(200).json({ message: "Producto eliminado" });
  } catch (error: any) {
    console.error("Error eliminando producto:", error);
    res.status(500).json({ message: error.message });
  }
}

// --- COUNT STOCK ---
async function countStock(req: Request, res: Response) {
  try {
    const result = await em.execute('SELECT SUM(stock) as stocktotal FROM producto')
    const stocktotal = Number(result[0]?.stocktotal ?? 0)
    res.status(200).json({ stocktotal }) // devuelve siempre un objeto con stocktotal
  } catch (error: any) {
    console.error('Error en countStock:', error)
    res.status(500).json({ stocktotal: 0 })
  }
}

// --- UPLOAD IMAGE ---
function rutaUpload(req: Request, res: Response, next: NextFunction) {
  upload.single('imagen')(req, res, function (err) {
    if (err) {
      return res.status(400).json({ message: `Error al subir archivo: ${err.message}` })
    }
    next()
  });
}

async function subirImagenProducto(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ningún archivo' })
  }
  res.json({ message: 'Imagen subida correctamente', filename: req.file.originalname })
}

// --- SEARCH ---
async function findByNameStart(req: Request, res: Response) {
  try {
    const { q } = req.query
    if (!q || typeof q !== 'string') return res.status(400).json({ message: 'El parámetro "q" es requerido' })

    const productos = await em.find(Producto, { $or: [{ name: { $like: `${q}%` } }] })
    res.status(200).json({ message: 'Productos encontrados', data: productos })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findByCategoriaStart(req: Request, res: Response) {
  try {
    const { categoriaId } = req.query
    const id = Number(categoriaId)
    if (!id || isNaN(id)) return res.status(400).json({ message: 'Categoría inválida' })

    const productos = await em.createQueryBuilder(Producto)
      .select('*')
      .where({ categoria: id })
      .leftJoinAndSelect('categoria', 'c')
      .getResultList()

    res.status(200).json({ message: 'Productos encontrados', data: productos })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

export {
  sanitizeProductoInput,
  findAll,
  findOne,
  add,
  update,
  remove,
  countStock,
  subirImagenProducto,
  rutaUpload,
  findByNameStart,
  findByCategoriaStart
}
