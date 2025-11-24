import { Request, Response, NextFunction } from 'express'
import { orm } from '../shared/orm.js'
import { Producto } from './producto.entity.js'
import multer from 'multer';
import fs from 'fs';

const em = orm.em

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = '../supermercado-front-js/public/imagenes/';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Guardar directamente con el nombre original
    cb(null, file.originalname);
  }
});

const upload = multer({ storage: storage });

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

async function findAll(req: Request, res: Response) {
    try {
    const productos = await em.find(
      Producto,
      {},
      { populate: ['categoria'] }
    )
    res.status(200).json({ message: 'found all productos', data: productos })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const producto = await em.findOneOrFail(
      Producto,
      { id },
      { populate: ['categoria'] }
    )
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
    const id = Number.parseInt(req.params.id)
    const productoToUpdate = await em.findOneOrFail(Producto, { id })
    em.assign(productoToUpdate, req.body.sanitizedInput)
    await em.flush()
    res
      .status(200)
      .json({ message: 'producto updated', data: productoToUpdate })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const producto = em.getReference(Producto, id)
    await em.removeAndFlush(producto)
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function countStock(req: Request, res: Response) {
  try {
    const result = await em.execute('SELECT SUM(stock) as totalStock FROM producto');
    const totalStock = Number(result[0]?.totalStock ?? 0);

    res.status(200).json(totalStock); // <- devuelve el número directo
  } catch (error: any) {
    console.error('Error en countStock:', error);
    res.status(500).json(0); // si hay error, devuelvo 0
  }
}

function rutaUpload(req: Request, res: Response, next: NextFunction) {
  console.log('rutaUpload ejecutándose...');
  upload.single('imagen')(req, res, function (err) {
    if (err) {
      console.error('Error en multer:', err);
      return res.status(400).json({ message: `Error al subir archivo: ${err.message}` });
    }
    console.log('Multer completado, archivo:', req.file);
    next();
  });
}

async function subirImagenProducto(req: Request, res: Response) {
  console.log('SubirImagenProducto ejecutándose...');
  console.log('Archivo recibido:', req.file);

  if (!req.file) {
    console.log('No hay archivo en la request');
    return res.status(400).json({ message: 'No se ha subido ningún archivo' });
  }

  console.log('Imagen guardada correctamente');
  res.json({ 
    message: 'Imagen subida correctamente',
    filename: req.file.originalname 
  });
}

async function findByNameStart(req: Request, res: Response) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "El parámetro 'q' es requerido" });
    }

    const productos = await em.find(
      Producto,
      {
        $or: [
          { name: { $like: `${q}%` } },
        ]
      },
    );

    res.status(200).json({ 
      message: 'Productos encontrados', 
      data: productos 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findByCategoriaStart(req: Request, res: Response) {
  try {
    const { categoriaId } = req.query;

    if (!categoriaId) {
      return res.status(400).json({ message: "El parámetro 'categoriaId' es requerido" });
    }

    const id = parseInt(categoriaId as string);
    if (isNaN(id)) {
      return res.status(400).json({ message: "El parámetro 'categoriaId' debe ser un número válido" });
    }

    const productos = await em.createQueryBuilder(Producto)
      .select('*')
      .where({ categoria: id })
      .leftJoinAndSelect('categoria', 'c')
      .getResultList();

    res.status(200).json({ 
      message: 'Productos encontrados', 
      data: productos 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeProductoInput, findAll, findOne, add, update, remove, countStock, subirImagenProducto, rutaUpload, findByNameStart, findByCategoriaStart}