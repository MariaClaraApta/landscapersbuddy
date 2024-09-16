"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("dotenv/config");
const stripe = require("stripe")(process.env.API_KEY);
const app = (0, express_1.default)();
const corsOptions = {
    origin: "https://www.thelandscapersbuddy.com",
    optionsSuccessStatus: 200,
};
app.use((0, cors_1.default)(corsOptions));
app.use(express_1.default.static("public"));
app.use(express_1.default.json());
const port = process.env.PORT || 4000;
app.post("/checkout", async (req, res) => {
    try {
        const lineItems = [];
        const { items } = req.body;
        const { shippingOption } = req.body;
        if (!items || !shippingOption) {
            return res
                .status(400)
                .json({ error: "Itens e opção de envio são necessários." });
        }
        console.log(shippingOption);
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
        console.log(shipping_options);
        if (shippingOption.state.includes("Florida") ||
            shippingOption.state.includes("Michigan")) {
            console.log("if");
            items.forEach((item) => {
                lineItems.push({
                    price: item.id,
                    quantity: item.quantity,
                    tax_rates: shippingOption.state.includes("Florida")
                        ? ["txr_1Pigiz2N63Rri8cVnYGwVy17"]
                        : ["txr_1PigiN2N63Rri8cV0FjjUR1x"],
                });
            });
        }
        else {
            console.log("else");
            items.forEach((item) => {
                lineItems.push({
                    price: item.id,
                    quantity: item.quantity,
                });
            });
        }
        console.log("oi");
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
        res.send(JSON.stringify({
            url: session.url,
        }));
    }
    catch (error) {
        console.error("Erro ao criar sessão de checkout:", error);
        res.status(500).json({
            error: "Ocorreu um erro ao processar o checkout. Tente novamente mais tarde.",
            details: error,
        });
    }
});
app.get("/", (req, res) => {
    res.send("Hello!");
});
app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
