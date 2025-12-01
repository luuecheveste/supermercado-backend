import dotenv from 'dotenv';
dotenv.config();

import 'reflect-metadata'
import express from 'express';
import { orm, syncSchema } from './shared/orm.js';
import { RequestContext } from '@mikro-orm/core';
import cors from 'cors';

import { productoRouter } from './producto/producto.route.js';
import { CategoriaRouter } from './categoria.prod/categoria.rout.js';
import { clienteRouter } from './cliente/cliente.routes.js';
import { distribuidorRouter } from './distribuidor/distribuidor.rout.js';
import { ZonaRouter } from './zona/zona.rout.js';
import { VentaRouter } from './venta/venta.rout.js';
import { ItemVentaRouter } from './item-venta/item.rout.js';
import { authRouter } from './auth/auth.routes.js';
import { mercadoPagoRouter } from './mercadopago/mercadopago.routes.js';

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  RequestContext.create(orm.em, next);
});

app.use(
  cors({
    origin: 'https://supermercado-front-js.vercel.app',
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  })
);

// Rutas
app.use("/api/auth", authRouter);
app.use('/api/cliente', clienteRouter);
app.use('/api/producto', productoRouter);
app.use('/api/distribuidor', distribuidorRouter);
app.use('/api/zona', ZonaRouter);
app.use('/api/categoria', CategoriaRouter);
app.use('/api/venta', VentaRouter);
app.use('/api/item-venta', ItemVentaRouter);
app.use('/api/mercadopago', mercadoPagoRouter);

app.use((_, res) => {
  return res.status(404).send({ message: 'Resource not found' });
});

// Solo toca la base si NO está en producción
if (process.env.NODE_ENV !== 'production') {
  console.log("➡ Ejecutando syncSchema() en modo DEV...");
  await syncSchema();
} else {
  console.log("➡ Producción: NO se ejecuta syncSchema()");
}

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
export { app };
