import cors from "cors";
import express, { Request, Response } from "express";
import moment from "moment";
import { v4 as uuidV4 } from "uuid";

const app = express();

app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());

const limit = 5000;
let usedLimit = 0;
let availableLimit = 0;

app.get("/", (request: Request, response: Response) => {
  return response.json({ message: "Hello World!" });
});

app.get("/teste", (request, response) => {
  const timeout = 10 * 1000;

  setTimeout(() => {
    console.log("timeout", timeout);
    return response.json({ message: "Hello world", teste: "testando" });
  }, timeout);
});

app.get("/installments", (request: Request, response: Response) => {
  const { desiredValue } = request.query;

  const valorDesejado = +desiredValue;

  const taxaJuros = 8 / 100;

  const juros = valorDesejado * taxaJuros;

  const montante = valorDesejado + juros;

  const parcelas = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 12; i >= 2; i--) {
    const obj = {
      valorDesejado,
      valorParcela: (montante / i).toFixed(2),
      qtdParcelas: i,
      taxaJuros,
    };

    parcelas.push(obj);
  }
  // const montante
  return response.json({ parcelas });
});

const transactions = [
  {
    id: 1,
    title: "Freelance do website",
    type: "deposit",
    category: "Dev",
    amount: 6000,
    createdAt: new Date("2021-02-12 09:00:00"),
  },
  {
    id: 2,
    title: "Aluguel",
    type: "withdraw",
    category: "Casa",
    amount: 1100,
    createdAt: new Date("2021-02-14 11:00:00"),
  },
];

app.get("/transactions", (request: Request, response: Response) => {
  return response.json({ transactions });
});

app.post("/transactions", (request: Request, response: Response) => {
  const { body } = request;

  const newTransaction = { ...body, id: uuidV4() };

  transactions.push(newTransaction);

  return response.json(transactions);
});

let loans = [];

app.get("/loans", (request: Request, response: Response) => {
  return response.json(loans);
});

const gerarParcelas = (
  valor: number,
  qtdParcelas: number,
  primeiraParcela: string
) => {
  const valorDesejado = valor;

  const taxaJuros = 8 / 100;

  const juros = valorDesejado * taxaJuros;

  const montante = valorDesejado + juros;

  const parcelas = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < qtdParcelas; i++) {
    const dataMoment = moment(primeiraParcela, "DD/MM/YYYY")
      .add(i, "months")
      .format("DD/MM/YYYY");

    const obj = {
      id: uuidV4(),
      parcelaNumero: i + 1,
      valorParcela: montante / qtdParcelas,
      status: false,
      dataPagamento: dataMoment,
    };
    parcelas.push(obj);
  }
  return parcelas;
};

app.post("/loans", (request: Request, response: Response) => {
  const { body } = request;

  const loan = {
    ...body,
    id: uuidV4(),
    parcelas: gerarParcelas(body.valor, body.qtdParcelas, body.primeiraParcela),
  };
  loans.push(loan);
  return response.status(201).json(loans);
});

app.get("/loans/:id", (request: Request, response: Response) => {
  const { id } = request.params;

  const filtered = loans.filter((loan) => loan.id === id);
  return response.json(filtered || {});
});

app.patch("/loans/pay/:id", (req, res) => {
  const { id } = req.params;
  const { idParcel, status } = req.body;

  /** Data that comes throw request */
  const obj = { id, idParcel, status };

  /** Filtering to obtain the unique loan to modify */
  const filteredLoan = loans.filter((loan) => loan.id === obj.id);

  /** Desctructuring parcelas */
  let { parcelas } = filteredLoan[0];

  /** updating parcel */
  const modifiedParcel = {
    ...parcelas.filter((parcel) => parcel.id === obj.idParcel)[0],
    status: obj.status,
  };

  /** updating array parcels */
  parcelas = parcelas.map((parcel) => {
    if (parcel.id === obj.idParcel) {
      return modifiedParcel;
    }
    return parcel;
  });

  /** Updating loan */
  const filteredLoanUpdated = { ...filteredLoan[0], parcelas };

  /** Updating array loan */
  const newLoans = loans.map((loan) => {
    if (loan.id === obj.id) {
      return filteredLoanUpdated;
    }
    return loan;
  });

  loans = [...newLoans];

  return res.json({ message: "payed", obj });
});

app.get("/limit", (request: Request, response: Response) => {
  usedLimit = loans.reduce(
    (accumulator, actualValue) => accumulator + actualValue.valor,
    0
  );
  availableLimit = limit - usedLimit;
  return response.json({ limit, usedLimit, availableLimit });
});

app.listen(3333, () => {
  console.log("Server is running!");
});
