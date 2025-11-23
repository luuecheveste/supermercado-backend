import type { Request, Response } from "express"
import { orm } from "../shared/orm.js"
import { Cliente } from "../cliente/cliente.entity.js"
import { Zona } from "../zona/zona.entity.js"
import bcrypt from "bcrypt" //libreria para encriptar contraseñas
import jwt from "jsonwebtoken" //libreria para manejar token JWT

const em = orm.em
const JWT_SECRET = process.env.JWT_SECRET;
if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET no definida en las variables de entorno");
}


class AuthController {
  async register(req: Request, res: Response) {
    try {
      // Eliminamos 'rol' de la desestructuración de req.body
      const { name, apellido, dni, usuario, contraseña, zonaId } = req.body

      // Validar que los campos requeridos estén presentes (sin 'rol')
      if (!name || !apellido || !dni || !usuario || !contraseña || !zonaId) {
        return res.status(400).json({
          message: "Nombre, apellido, DNI, usuario, contraseña y zona son requeridos",
        })
      }

      // Verificar si la zona existe (Aunque se selecciona de un listado, es buena práctica verificar)
      console.log("Verificando zona:", zonaId)
      const zona = await em.findOne(Zona, { id: zonaId })
      if (!zona) {
        console.log("Zona no encontrada")
        return res.status(400).json({
          message: "La zona seleccionada no existe",
        })
      }
      console.log("Zona encontrada:", zona.name)

      // Verificar si el usuario ya existe
      const clienteExistente = await em.findOne(Cliente, { usuario })
      if (clienteExistente) {
        return res.status(400).json({
          message: "El usuario ya existe",
        })
      }

      // Verificar si el DNI ya existe
      const dniExistente = await em.findOne(Cliente, { dni })
      if (dniExistente) {
        return res.status(400).json({
          message: "El DNI ya está registrado",
        })
      }

      // Encriptar la contraseña
      const saltRounds = 10
      const hashedPassword = await bcrypt.hash(contraseña, saltRounds)

      // Crear nuevo cliente
      const nuevoCliente = new Cliente()
      nuevoCliente.name = name
      nuevoCliente.apellido = apellido
      nuevoCliente.dni = dni
      nuevoCliente.usuario = usuario
      nuevoCliente.contraseña = hashedPassword
      nuevoCliente.rol = false //Se establece el rol por defecto como falso
      nuevoCliente.zona = zona

      await em.persistAndFlush(nuevoCliente)


      res.status(201).json({
        message: "Cliente registrado exitosamente",
      })
      
    } catch (error) {
      console.error("Error en registro:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { usuario, contraseña } = req.body
      console.log("Datos recibidos:", { usuario, contraseña })

      // Validar campos requeridos
      if (!usuario || !contraseña) {
        return res.status(400).json({
          message: "Usuario y contraseña son requeridos",
        })
      }

      // Buscar cliente por usuario
      const cliente = await em.findOne(Cliente, { usuario })
      console.log("Cliente encontrado:", cliente ? "Sí" : "No")
      if (!cliente) {
        return res.status(401).json({
          message: "Credenciales inválidas",
        })
      }

      // Verificar contraseña
      const passwordValida = await bcrypt.compare(contraseña, cliente.contraseña)
      console.log("Contraseña válida:", passwordValida)
      if (!passwordValida) {
        return res.status(401).json({
          message: "Credenciales inválidas",
        })
      }

      // Generar token JWT
      const token = jwt.sign(
        {
          id: cliente.id,
          usuario: cliente.usuario,
          name: cliente.name,
          apellido: cliente.apellido,
          rol: cliente.rol,
          zona: cliente.zona ? { id: cliente.zona.id, name: cliente.zona.name } : null,
        }, //payload(información del cliente)
        JWT_SECRET!, //Secret(firma del token)
        { expiresIn: "20m" },//Tieempo de expiración del token, una vez cumplido el tienmo se debera volver a iniciar sesion
      )

      res.json({
        message: "Login exitoso",
        token,
      })
    } catch (error) {
      console.error("Error en login:", error)
      res.status(500).json({ message: "Error interno del servidor" })
    }
  }
}

export const authController = new AuthController()
