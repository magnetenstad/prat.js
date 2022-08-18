import { Talk } from './talk.js';
import prompt from 'prompt';
//@ts-ignore
import { File } from 'virtual-file-system';

const run = (talk: Talk) => {
  prompt.get(
    {
      name: 'choice',
    },
    (_, result) => {
      const input = result.choice as string;
      if (input !== 'Q') {
        talk.input(input);
        console.log(talk.talk());
        run(talk);
      }
    }
  );
};

const main = () => {
  const talk_string = File.read('../talks/talk.talk').data;
  console.log(talk_string);
  const talk = Talk.fromString(talk_string);
  console.log(JSON.stringify(talk));
  console.log(talk.talk());
  prompt.start();
  run(talk);
};

main();
