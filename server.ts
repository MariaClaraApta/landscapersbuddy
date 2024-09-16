import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
const stripe = require("stripe")(process.env.API_KEY);

const app = express();

const corsOptions = {
  origin: "https://www.thelandscapersbuddy.com",
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.static("public"));
app.use(express.json());

const port = process.env.PORT || 4000;

interface LineItemsType {
  price: string;
  quantity: number;
  tax_rates?: string[];
}

interface ShippingOptionType {
  shippingOption: {
    state: string;
    tax: number;
    shipping: number;
  };
}

interface ItemsType {
  items: [
    {
      id: string;
      quantity: number;
    }
  ];
}

app.post("/checkout", async (req: Request, res: Response) => {
  try {
    const lineItems: LineItemsType[] = [];
    const { items } = req.body as ItemsType;
    const { shippingOption }: ShippingOptionType = req.body;

    if (!items || !shippingOption) {
      return res
        .status(400)
        .json({ error: "Itens e opção de envio são necessários." });
    }

    let shipping_options = [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: {
            amount: shippingOption.shipping * 100,
            currency: "usd",
          },
          display_name: shippingOption.state,
          delivery_estimate: {
            minimum: {
              unit: "day",
              value: 7,
            },
            maximum: {
              unit: "day",
              value: 10,
            },
          },
        },
      },
    ];

    if (
      shippingOption.state.includes("Florida") ||
      shippingOption.state.includes("Michigan")
    ) {
      items.forEach((item) => {
        lineItems.push({
          price: item.id,
          quantity: item.quantity,
          tax_rates: shippingOption.state.includes("Florida")
            ? ["txr_1Pigiz2N63Rri8cVnYGwVy17"]
            : ["txr_1PigiN2N63Rri8cV0FjjUR1x"],
        });
      });
    } else {
      items.forEach((item) => {
        lineItems.push({
          price: item.id,
          quantity: item.quantity,
        });
      });
    }

    const session = await stripe.checkout.sessions.create({
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
      shipping_options,
      line_items: lineItems,
      custom_fields: [
        {
          key: "phoneNumber",
          label: {
            type: "custom",
            custom: "Phone number",
          },
          type: "text",
        },
      ],
      mode: "payment",
      allow_promotion_codes: true,
      success_url: "https://www.thelandscapersbuddy.com/product",
    });

    res.send(
      JSON.stringify({
        url: session.url,
      })
    );
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);

    res.status(500).json({
      error:
        "Ocorreu um erro ao processar o checkout. Tente novamente mais tarde.",
      details: error,
    });
  }
});

app.get("/", (req: Request, res: Response) => {
  res.send("Hello!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
