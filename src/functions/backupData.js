import { onMount } from 'svelte';

export default function data() {
  const fallbackImg = '../img/dummy3.jpg';

  let snapshot1 = fallbackImg;
  let snapshot2 = fallbackImg;
  let snapshot3 = fallbackImg;

  snapshot1 = localStorage.getItem('snapshot1')
    ? localStorage.getItem('snapshot1')
    : fallbackImg;
  console.log(snapshot1);

  snapshot2 = localStorage.getItem('snapshot2')
    ? localStorage.getItem('snapshot2')
    : fallbackImg;

  snapshot3 = localStorage.getItem('snapshot3')
    ? localStorage.getItem('snapshot3')
    : fallbackImg;

  return [
    {
      isMirrored: false,
      currentChapter: '01',
      subTitle: 'Marine landing',
      moments: [
        {
          title: 'title',
          image: snapshot1,
          description:
            '1Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy3.jpg',
          description:
            '2Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy4.jpg',
          description:
            '3Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        }
      ]
    },
    {
      isMirrored: true,
      currentChapter: '02',
      subTitle: 'Wegversperingen',
      moments: [
        {
          title: 'title',
          image: snapshot2,
          description:
            '1Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy5.jpg',
          description:
            '2Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy6.jpg',
          description:
            '3Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        }
      ]
    },
    {
      isMirrored: false,
      currentChapter: '03',
      subTitle: 'Honger',
      moments: [
        {
          title: 'title',
          image: snapshot3,
          description:
            '1Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy4.jpg',
          description:
            '2Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        },
        {
          title: 'title',
          image: '../img/dummy5.jpg',
          description:
            '3Na de uitvinding van de fotografie in 1839 werd de rol van de expeditie overgenomen door de fotograaf. Landschappen, mensen en hun leefomstandigheden waren de belangrijkste onderwerpen.'
        }
      ]
    }
  ];
}
