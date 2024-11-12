import { FastifyInstance } from "fastify";
import { knex } from "../database";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { checkSessionIdExisting } from "../middlewares/check-session-id-existing";

// Cookies <--> Formas da gente manter contexto entre requisições

// Unitários: unidade da sua aplicação
// Integração: comunicação entre duas unidades
// e2e - ponta a ponta: simulam um usuário utilizando a aplicação

// Pirâmide de testes: E2E (não dependem de nenhuma tecnologia, não dependem de arquiretura)


export async function transactionsRoutes(app: FastifyInstance) {
  app.get("/", { preHandler: [checkSessionIdExisting] }, async (request) => {
    const { sessionId } = request.cookies;

    const transactions = await knex("transactions")
      .where("session_id", sessionId)
      .select("*");

    return { transactions };
  });

  app.get(
    "/:id",
    { preHandler: [checkSessionIdExisting] },
    async (request, reply) => {
      const getTransactionParamsSchema = z.object({
        id: z.string().uuid()
      });

      const { id } = getTransactionParamsSchema.parse(request.params);

      const { sessionId } = request.cookies;

      const transaction = await knex("transactions")
        .where({ session_id: sessionId, id })
        .first();

      return { transaction };
    }
  );

  app.get("/summary", { preHandler: [checkSessionIdExisting] }, async (request) => {
    const { sessionId } = request.cookies;

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "amount" })
      .first();

    return { summary };
  });

  app.post("/", async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"])
    });

    const { title, amount, type } = createTransactionBodySchema.parse(
      request.body
    );

    let sessionId = request.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      reply.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7 // 7 days
      });
    }

    const transaction = await knex("transactions")
      .insert({
        id: randomUUID(),
        title,
        amount: type === "credit" ? amount : amount * -1,
        session_id: sessionId
      })
      .returning("*");

    return reply.status(201).send(transaction);
  });

  app.get("/1000", async () => {
    const transactions = await knex("transactions")
      .where("amount", 1000)
      .select("*");

    return transactions;
  });
}
