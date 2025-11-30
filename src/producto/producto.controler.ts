// src/producto/producto.controler.ts
import { Request, Response, NextFunction } from "express";
import { orm } from "../shared/orm.js";
import { Producto } from "./producto.entity.js";
import multer from "multer";
import fs from "fs";
import path from "path";

const em = orm.em;

// --- Configuración Multer ---
const uploadPath = path.join(process.cwd(), "supermercado-front-js/public/imagenes");
if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadPath),
  filename: (req, file, cb) => cb(null, file.originalname),
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile?: boolean) => void) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Solo se permiten archivos de imagen"), false);
};

const upload = multer({ storage, fileFilter });
const rutaUpload = upload.single("imagen");

// --- Sanitizar input ---
function sanitizeProductoInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    descripcion: req.body.descripcion,
    precio: req.body.precio,
    stock: req.body.stock,
    categoria: req.body.categoria,
    estado: req.body.estado,
  };

  Object.keys(req.body.sanitizedInput).forEach((key) => {
    if (req.body.sanitizedInput[key] === undefined) delete req.body.sanitizedInput[key];
  });

  next();
}

// --- CRUD Productos ---
async function findAll(req: Request, res: Response) {
  try {
    const productos = await em.find(Producto, {}, { populate: ["categoria"], orderBy: { id: "ASC" } });
    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOneOrFail(Producto, { id }, { populate: ["categoria"] });
    res.status(200).json({ message: "Producto encontrado", data: producto });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function add(req: Request, res: Response) {
  try {
    const producto = em.create(Producto, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: "Producto creado", data: producto });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const productoToUpdate = await em.findOneOrFail(Producto, { id });

    // Manejo de imagen: reemplazo con req.file
    if ((req as any).file) {
      // eliminar anterior
      if (productoToUpdate.imagen) {
        const oldPath = path.join(uploadPath, path.basename(productoToUpdate.imagen));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error("Error eliminando archivo antiguo:", e); }
        }
      }
      productoToUpdate.imagen = `/imagenes/${(req as any).file.filename}`;
    } else if ("imagen" in req.body && req.body.imagen === null) {
      // Si el body trae imagen: null -> eliminar referencia y archivo
      if (productoToUpdate.imagen) {
        const oldPath = path.join(uploadPath, path.basename(productoToUpdate.imagen));
        if (fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.error("Error eliminando archivo antiguo:", e); }
        }
      }
      productoToUpdate.imagen = null as any; // permitir null en la entidad si así está definido
    }

    // Asignar demás campos 
    em.assign(productoToUpdate, req.body.sanitizedInput);
    await em.flush();

    res.status(200).json({ message: "Producto actualizado", data: productoToUpdate });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOne(Producto, { id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    // eliminar imagen si existe
    if (producto.imagen) {
      const oldPath = path.join(uploadPath, path.basename(producto.imagen));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error("Error eliminando archivo:", e); }
      }
    }

    await em.removeAndFlush(producto);
    res.status(200).json({ message: "Producto eliminado" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// --- Stock total ---
async function countStock(req: Request, res: Response) {
  try {
    const result = await em.execute("SELECT SUM(stock) as stocktotal FROM producto");
    const stocktotal = Number(result[0]?.stocktotal ?? 0);
    res.status(200).json({ stocktotal });
  } catch (error: any) {
    res.status(500).json({ stocktotal: 0 });
  }
}

// --- Subir imagen (POST /api/producto/:id/imagen) ---
async function subirImagenProducto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });
    if (!(req as any).file) return res.status(400).json({ message: "No se subió ninguna imagen" });

    const producto = await em.findOne(Producto, { id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    // eliminar anterior
    if (producto.imagen) {
      const oldPath = path.join(uploadPath, path.basename(producto.imagen));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error("Error eliminando archivo antiguo:", e); }
      }
    }

    producto.imagen = `/imagenes/${(req as any).file.filename}`;
    await em.flush();

    return res.status(200).json({
      message: "Imagen subida y asociada",
      filename: (req as any).file.filename,
      imagen: producto.imagen,
      data: producto,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// --- Eliminar imagen (DELETE /api/producto/:id/imagen) ---
async function deleteImagenProducto(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (!id || isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOne(Producto, { id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    if (producto.imagen) {
      const oldPath = path.join(uploadPath, path.basename(producto.imagen));
      if (fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.error("Error eliminando archivo antiguo:", e); }
      }
    }

    producto.imagen = null as any;
    await em.flush();

    return res.status(200).json({ message: "Imagen eliminada", data: producto });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
}

// --- Buscar ---
async function findByNameStart(req: Request, res: Response) {
  try {
    const { q } = req.query;
    if (!q || typeof q !== "string") return res.status(400).json({ message: 'El parámetro "q" es requerido' });

    const productos = await em.find(Producto, { $or: [{ name: { $like: `${q}%` } }] });
    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

async function findByCategoriaStart(req: Request, res: Response) {
  try {
    const { categoriaId } = req.query;
    const id = Number(categoriaId);
    if (!id || isNaN(id)) return res.status(400).json({ message: "Categoría inválida" });

    const productos = await em
      .createQueryBuilder(Producto)
      .select("*")
      .where({ categoria: id })
      .leftJoinAndSelect("categoria", "c")
      .getResultList();

    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// --- Export final ---
export {
  sanitizeProductoInput,
  findAll,
  findOne,
  add,
  update,
  remove,
  countStock,
  rutaUpload,
  subirImagenProducto,
  deleteImagenProducto,
  findByNameStart,
  findByCategoriaStart,
};
