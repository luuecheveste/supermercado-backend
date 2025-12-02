import { Request, Response } from 'express'
import { orm } from '../shared/orm.js'
import { Categoria } from './categoria.entity.js'
import { t } from '@mikro-orm/core'

const em = orm.em

async function findAll(req: Request, res: Response) {
    try {
    const categorias = await em.find(Categoria, {})
    res
      .status(200)
      .json({ message: 'found all categorias', data: categorias })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const categorias = await em.findOneOrFail(Categoria, { id })
    res
      .status(200)
      .json({ message: 'found categorias de productos', data: categorias })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try {
    const categorias = em.create(Categoria, req.body)
    await em.flush()
    res
      .status(201)
      .json({ message: 'Categoria created', data: categorias })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function update(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const categorias = em.getReference(Categoria, id)
    em.assign(categorias, req.body)
    await em.flush()
    res.status(200).json({ message: 'Categoria updated' })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const categoria = await em.findOne(Categoria, { id }, { populate: ['productos'] })

    if (!categoria) {
      return res.status(404).json({ message: 'Categoría no encontrada' })
    }
    if (categoria.productos?.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar la categoría porque tiene productos asociados' 
      })
    }
    await em.removeAndFlush(categoria)
    res.status(200).json({ message: 'Categoría eliminada correctamente' })
  } catch (error: any) {
    console.error(error)
    res.status(500).json({ message: error.message })
  }
}


async function findByNameStart(req: Request, res: Response) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "El parámetro 'q' es requerido" });
    }

    const categorias = await em.find(
      Categoria,
      {
        $or: [
          { name: { $like: `${q}%` } },  
          { description: { $like: `${q}%` } },
        ]
      },
    );

    res.status(200).json({ 
      message: 'Categorias encontradas', 
      data: categorias 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export {findAll, findOne, add, update, remove, findByNameStart }
