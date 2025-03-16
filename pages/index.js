import Head from 'next/head';
import JSONFormatter from '../components/JSONFormatter';

export default function Home() {
  return (
    <>
      <Head>
        <title>JSON Formatter - Форматирование JSON онлайн</title>
        <meta name="description" content="Бесплатный инструмент для форматирования и валидации JSON кода онлайн" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <JSONFormatter />
    </>
  );
}
