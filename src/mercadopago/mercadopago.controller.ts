import { MercadoPagoConfig, Preference } from "mercadopago";
import { Request, Response } from "express";
import "dotenv/config";

// Configuración global con el token de producción (APP_USR)
const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN_PROD as string, // APP_USR token
});

export const createPreference = async (req: Request, res: Response) => {
  try {
    const items = req.body.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "No se recibieron items válidos" });
    }

    console.log("Items recibidos:", items);

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((item: any, index: number) => ({
          id: String (index),
          title: item.title,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        back_urls: {
          success: `${process.env.FRONT_URL}/success`,
          failure: `${process.env.FRONT_URL}/failure`,
          pending: `${process.env.FRONT_URL}/pending`,
        },
        auto_return: "approved", // redirige automáticamente al usuario tras el pago aprobado
      },
    });

    return res.status(200).json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point, // opcional, solo para pruebas
    });
  } catch (error: any) {
    console.error("Error creando preferencia:", error);
    return res.status(500).json({ error: error.message || "Error interno al crear la preferencia" });
  }
};
