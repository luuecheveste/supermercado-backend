import { Request, Response, NextFunction } from 'express'
import { Zona } from './zona.entity.js'
import { orm } from '../shared/orm.js'

const em = orm.em

function sanitizeZonaInput(req: Request, res: Response, next: NextFunction) {
  req.body.sanitizedInput = {
    name:req.body.name,
    description: req.body.description,
    clientes: req.body.clientes,
    distribuidores: req.body.distribuidores,
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
    const zonas = await em.find(
      Zona,
      {},
      { populate: ['distribuidores'] } //si quiero traer los distribuidores asociados a la zona
    )
    res.status(200).json({ message: 'found all zonas', data: zonas })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findOne(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const zona = await em.findOneOrFail(
      Zona,
      { id },
      { populate: ['clientes', 'distribuidores'] } //si quiero traer los clientes y distribuidores asociados a la zona
    )
    res.status(200).json({ message: 'found zona', data: zona })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function add(req: Request, res: Response) {
  try {
    const zona = em.create(Zona, req.body.sanitizedInput);
    await em.flush();
    res.status(201).json({ message: 'Zona creada', data: zona });
  } catch (error: any) {
    console.error('Error ZonaController.add:', error);
    res.status(500).json({ message: error.message });
  }
}

async function update(req: Request, res: Response) {
 try {
    const id = Number.parseInt(req.params.id)
    const zonaToUpdate = await em.findOneOrFail(Zona, { id })
    em.assign(zonaToUpdate, req.body.sanitizedInput)
    await em.flush()
    res
      .status(200)
      .json({ message: 'zona updated', data: zonaToUpdate })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function remove(req: Request, res: Response) {
  try {
    const id = Number.parseInt(req.params.id)
    const zona = em.getReference(Zona, id)
    await em.removeAndFlush(zona)
    res.status(200).json({ message: 'zona deleted', data: zona })
  } catch (error: any) {
    res.status(500).json({ message: error.message })
  }
}

async function findByNameStart(req: Request, res: Response) {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ message: "El parámetro 'q' es requerido" });
    }

    const zonas = await em.find(
      Zona,
      {
        $or: [
          { name: { $like: `${q}%` } },
        ]
      },
      { populate: ['distribuidores'] } 
    );

    res.status(200).json({ 
      message: 'Zonas encontradas', 
      data: zonas 
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

export { sanitizeZonaInput, findAll, findOne, add, update, remove, findByNameStart }