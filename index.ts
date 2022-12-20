import { resolve } from "path";
import { createInterface } from "readline";
import { read } from "fs";
import { runLearn } from "./learn";

async function readGipperParametersLearning() {
  const sequence: Array<number> = [];
  while (true) {
    const num = await input(`sequence[${sequence.length}]: `);
    if (isNaN(Number(num)) || !num) {
      break;
    }
    sequence.push(Number(num));
  }

  const isNullFirstLayer = Number(await input("Зануляем первый слой?(1 | 0) "));
  const isNullNextLayers = Number(
    await input("Зануляем последующие слои?(1 | 0) ")
  );

  const it = Number(await input("Итераций: "));
  const a = Number(await input("Альфа: "));
  const e = Number(await input("Допустимая среднеквадратичная ошибка: "));
  const p = Number(await input("Размер окна: "));
  const m = Number(await input("Кол-во нейронов второго слоя: "));

  return {
    it,
    a,
    e,
    p,
    m,
    sequence,
    isNullFirstLayer,
    isNullNextLayers,
  };
}

async function readGipperParametersPredication() {
  const sequence: Array<number> = [];
  while (true) {
    const num = await input(`sequence[${sequence.length}]: `);
    if (isNaN(Number(num)) || !num) {
      break;
    }
    sequence.push(Number(num));
  }

  const isNullFirstLayer = Number(await input("Зануляем первый слой?(1 | 0) "));
  const isNullNextLayers = Number(
    await input("Зануляем последующие слои?(1 | 0) ")
  );

  const n = Number(await input("Количество предсказываемых чисел: "));

  const firstWeightsLayer = (await read(
    resolve(__dirname, "..", "..", "с", "w1.txt") as any,
    () => {}
  )) as any;
  const secondWeightsLayer = (await read(
    resolve(__dirname, "..", "..", "с", "w2.txt") as any,
    () => {}
  )) as any;
  let context = (await read(
    resolve(__dirname, "..", "..", "с", "ctx.txt") as any,
    () => {}
  )) as any;

  const p = firstWeightsLayer.n - context.m;
  const m = context.m;

  return {
    p,
    m,
    firstWeightsLayer,
    secondWeightsLayer,
    context,
    sequence,
    isNullFirstLayer,
    isNullNextLayers,
    n,
  } as any;
}

function multiplication(first: any, second: any) {
  const { n } = first;
  const { m } = second;

  const maltmulRow = (x: Array<number>, i: number) => {
    let value = 0;

    for (let j = 0; j < second.n; j += 1) {
      value += x[j] * second.data[j][i];
    }
    return value;
  };

  return {
    m,
    n,
    data: first.data.map((x: Array<number>, i: number) => {
      const s = [];
      for (let i = 0; i < m; i += 1) {
        s.push(maltmulRow(x, i));
      }

      return s;
    }),
  };
}

async function main() {
  console.log("Обучение - 1");
  console.log("Предсказание - 2");

  const choise = await input(":");

  if (choise.trim()[0] === "1" || choise.trim()[0] === "2") {
    if (choise.trim()[0] === "1") {
      const gipperParameters = await readGipperParametersLearning();

      await runLearn({
        availableIterations: gipperParameters.it,
        alpha: gipperParameters.a,
        p: gipperParameters.p,
        m: gipperParameters.m,
        error: gipperParameters.e,
        mode: [
          Boolean(gipperParameters.isNullFirstLayer),
          Boolean(gipperParameters.isNullNextLayers),
        ],
        sequence: gipperParameters.sequence,
      });

      input.io.close();
    } else if (choise.trim()[0] === "2") {
      const gipperParameters = await readGipperParametersPredication();
      console.dir(gipperParameters, { depth: 10 });

      const predicted: Array<number> = [...gipperParameters.sequence];

      if (gipperParameters.isNullFirstLayer) {
        gipperParameters.context = {
          n: 1,
          m: gipperParameters.m,
          data: new Array(1).fill(new Array(gipperParameters.m).fill(0)),
        };
      }

      for (let i = 0; i < gipperParameters.n; i += 1) {
        let inputValues = predicted.slice(
          predicted.length - gipperParameters.p
        );

        if (gipperParameters.isNullNextLayers && i) {
          gipperParameters.context = {
            n: 1,
            m: gipperParameters.m,
            data: new Array(1).fill(new Array(gipperParameters.m).fill(0)),
          };
        }

        const newValue = multiplication(
          multiplication(
            {
              n: 1,
              m: gipperParameters.m + gipperParameters.p,
              data: [inputValues.concat(gipperParameters.context.data[0])],
            },
            gipperParameters.firstWeightsLayer
          ),
          gipperParameters.secondWeightsLayer
        ).data[0][0];
        predicted.push(newValue);
      }

      console.log("Числа, которые я предсказал: ", predicted);
      input.io.close();
    }
  } else {
    input.io.close();
  }

  process.exit();
}

function input(question: string): Promise<string> {
  return new Promise((r) => input.io.question(question, r));
}
input.io = createInterface({
  input: process.stdin,
  output: process.stdout,
});

main();
