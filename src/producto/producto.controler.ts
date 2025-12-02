import { Request, Response, NextFunction } from "express";
import { orm } from "../shared/orm.js";
import { Producto } from "./producto.entity.js";

const em = orm.em;

// ---------------- Sanitizar input ----------------
function sanitizeProductoInput(req: Request, _res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name: req.body.name,
    descripcion: req.body.descripcion,
    precio: req.body.precio,
    stock: req.body.stock,
    categoria: req.body.categoria,
    estado: req.body.estado,
    imagen: req.body.imagen,
  };

  Object.keys(req.body.sanitizedInput).forEach((k) => {
    if (req.body.sanitizedInput[k] === undefined) delete req.body.sanitizedInput[k];
  });

  next();
}

// ---------------- Helper ----------------
function safeNumber(val: any) {
  const n = Number(val);
  return Number.isNaN(n) ? 0 : n;
}

// ---------------- FIND ALL con filtros ----------------
async function findAll(req: Request, res: Response) {
  try {
    const { q, categoriaId } = req.query;

    const where: any = {};

    if (q && typeof q === "string") {
      where.name = { $like: `${q}%` };
    }

    if (categoriaId !== undefined) {
      const cid = Number(categoriaId);
      if (!Number.isNaN(cid)) where.categoria = cid;
    }

    const productos = await em.find(
      Producto,
      where,
      { populate: ["categoria"], orderBy: { id: "ASC" } }
    );

    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- FIND ONE ----------------
async function findOne(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOneOrFail(
      Producto,
      { id },
      { populate: ["categoria"] }
    );

    res.status(200).json({ message: "Producto encontrado", data: producto });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- ADD ----------------
async function add(req: Request, res: Response) {
  try {
    const nuevo = em.create(Producto, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: "Producto creado", data: nuevo });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- UPDATE ----------------
async function update(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOneOrFail(Producto, { id });

    em.assign(producto, req.body.sanitizedInput);
    await em.flush();

    res.status(200).json({ message: "Producto actualizado", data: producto });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- REMOVE ----------------
async function remove(req: Request, res: Response) {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

    const producto = await em.findOne(Producto, { id });
    if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

    await em.removeAndFlush(producto);

    res.status(200).json({ message: "Producto eliminado" });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- STOCK TOTAL ----------------
async function countStock(req: Request, res: Response) {
  try {
    // Traemos todos los productos, activos e inactivos
    const productos = await em.find(Producto, {});

    const stocktotal = productos.reduce((acc, p) => {
      const stockNum = Number(p.stock);
      return acc + (isNaN(stockNum) ? 0 : stockNum);
    }, 0);

    res.status(200).json({ stocktotal });
  } catch (error: any) {
    res.status(500).json({ stocktotal: 0, error: error.message });
  }
}

// ---------------- BUSCAR POR NOMBRE ----------------
async function findByNameStart(req: Request, res: Response) {
  try {
    const { q, all } = req.query;
    if (!q || typeof q !== "string")
      return res.status(400).json({ message: 'Parámetro "q" requerido' });

    const where: any = { name: { $like: `${q}%` } };

    if (!(typeof all === "string" && all.toLowerCase() === "true")) {
      where.estado = true; // solo activos si no se pasa all=true
    }

    const productos = await em.find(
      Producto,
      where,
      { populate: ["categoria"], orderBy: { id: "ASC" } }
    );

    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

// ---------------- BUSCAR POR CATEGORIA ----------------
async function findByCategoriaStart(req: Request, res: Response) {
  try {
    const id = Number(req.query.categoriaId);
    const { all } = req.query;
    if (isNaN(id))
      return res.status(400).json({ message: "Categoría inválida" });

    const where: any = { categoria: id };
    if (!(typeof all === "string" && all.toLowerCase() === "true")) {
      where.estado = true; // solo activos si no se pasa all=true
    }

    const productos = await em.find(
      Producto,
      where,
      { populate: ["categoria"], orderBy: { id: "ASC" } }
    );

    res.status(200).json({ message: "Productos encontrados", data: productos });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
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
  findByNameStart,
  findByCategoriaStart,
};