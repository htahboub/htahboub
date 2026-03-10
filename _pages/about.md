---
layout: about
title: about
permalink: /
subtitle: <a href='https://neu.edu'>Northeastern University</a>. Research Assistant.<br>tahboub.h [at] northeastern [dot] edu

profile:
  align: right
  image: pfp.png
  image_circular: true # crops the image to make it circular
  address:

news: false            # includes a list of news items
latest_posts: false    # includes a list of the newest posts
selected_papers: false # includes a list of papers marked as "selected={true}"
social: false          # includes social icons at the bottom of the page
# bundle exec jekyll serve --lsi
---
<script>
    var pattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var current = 0;
    var isTimePassed = false;

    var keyHandler = function (event) {
        if (pattern.indexOf(event.key) >= 0 && event.key === pattern[current]) {
            current++;
            if (pattern.length === current) {
                current = 0;
                document.getElementById("howard").classList.toggle('hidden');
                document.getElementById("gaster").classList.toggle('hidden');
                document.getElementById("mapmyvisitors-widget").style.display = "block";
            }
        } else {
            current = 0;
        }
    };

    document.addEventListener('keydown', keyHandler, false);

    const me = document.getElementById('me');
    me.addEventListener('click', function(event) {
      event.preventDefault();
      document.getElementById("howard").classList.toggle('hidden');
      document.getElementById("gaster").classList.toggle('hidden');
    });

    function checkTime() {
      if (document.getElementById("gaster").classList.contains('hidden')) {
          isTimePassed = true;
          document.getElementById("howard").classList.toggle('hidden');
          document.getElementById("gaster").classList.toggle('hidden');
      }
    }
    setTimeout(checkTime, 6e5); // 10 minutes

    if (Math.floor(Math.random() * 1000) < 2) {
      me.src = 'assets/img/little.jpeg';
    } else if (Math.floor(Math.random() * 100) < 5) {
      me.src = 'assets/img/bike.jpg';
    } else if (Math.floor(Math.random() * 200) < 1) {
      me.src = 'assets/img/camcorder.jpeg';
    }
</script>
<img class="hidden unselectable" style="position: fixed; right: 0; bottom: 35px; height: 40vh;" id="howard" draggable="false" src="assets/img/howard.gif">
<img class="hidden unselectable" style="position: fixed; left: 20px; bottom: 0; height: 40vh;" id="gaster" draggable="false" src="assets/img/gaster.gif">
Hello! My name is Hamza, and I am a research assistant in Professor [Huaizu Jiang](https://jianghz.me/)'s Visual Intelligence lab at Northeastern University. I graduated from Northeastern University with a major in computer science and mathematics.

My research centers on multimodal learning, with a specific emphasis on social interaction understanding and egocentric video to holistically interpret human behavior. I am interested in both social intelligence from both an understanding and a generation point of view. My work on the former was published in TMLR, in which I investigated why pre-trained VLMs struggle to model multiple social perception tasks simultaneously, uncovering a phenomenon we termed "social degradation" and overcoming it to achieve positive transfer across diverse social tasks. Today, I am working on the generation side: improving the social coherence of video generation models to produce more realistic human-centric videos.

<style>
.flex-container {
  display: flex;
  gap: 10px;
  padding: 5px 20px;
}
.column {
  flex: 1;
  padding-left: 15px;
}
@media (max-width: 790px) {
  .flex-container {
    flex-direction: column;
    gap: 0;
  }
  .column {
    padding-left: 5px;
  }
  .column:first-child ol {
    margin-bottom: 0;
  }
}
.hidden {
  display: none;
}
.unselectable {
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  z-index: -999;
}
</style>

<h4 style="margin-top: 25px;">Research Experience</h4>
<div class="flex-container">
  <div class="column">
    <ol style="padding-left: 0px">
      <li><b>Human-centric video generation</b> with <a href="https://www.linkedin.com/in/joseph-y-gu">Joseph Gu</a> and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>June 2025 – Present</li>
            <li>Addressing the weakness of video generation models in generating socially coherent scenes.</li>
            <li>Building diffusion/flow models to address these gaps by explicitly modeling each agent in the video (intent, beliefs, knowledge, etc...) in a latent space that allows the model to perform higher-order reasoning about realistic goals and actions.</li>
          </ul>
      </li>
      <li><b>Addressing social degradation in pre-trained vision-language models</b> with Professors <a href="https://wyshi.github.io/">Weiyan Shi</a>, <a href="https://www.ganghua.org/">Gang Hua</a>, and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>February 2025 – Present</li>
            <li><u style="color: #c00; font-weight: bold;">Published in TMLR.</u> <a href="https://arxiv.org/abs/2512.01148">[arxiv]</a> <a href="https://openreview.net/forum?id=ofYhEoKIEx">[openreview]</a></li>
            <li>Led a project to unify different visual social interaction understanding tasks under one model, leveraging the synergies between diverse tasks to achieve positive transfer and competitive performance overall.</li>
            <li>Revealed popular VLMs of the same scale suffer a degradation impairing their social understanding and leading to negative transfer, which I uncovered comes from reduced social decodability of the visual representations after VLM training.</li>
            <li>Working on extending the work to handle complex compositional social tasks.</li>
          </ul>
      </li>
      <li><b>Egocentric Werewolf strategy classification and utterance prediction</b> with <a href="https://scholar.google.com/citations?user=n383kOYAAAAJ">Harrison Kim</a> and Professors <a href="https://wyshi.github.io/">Weiyan Shi</a> and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>January 2024 – January 2025</li>
            <li>Led a project to understand subtle social cues from an egocentric perspective.</li>
            <li>Significantly improved performance in strategy prediction over prior methods.</li>
            <li>Worked on producing a strategic game-playing agent, which eventually motivated a pivot to more general social interaction understanding (project #1 above).</li>
          </ul>
      </li>
    </ol>
  </div>
  <div class="column">
    <ol start=4 style="padding-left: 0px">
      <li><b>Modeling nuclei segmentation</b> with <a href="https://www.linkedin.com/in/evanliu518/">Evan Liu</a> and <a href="https://scholar.google.com/citations?user=n383kOYAAAAJ">Harrison Kim</a> @ <a href="https://www.gene.com/">Genentech gRED</a>
          <ul>
            <li>October 2023 – December 2023</li>
            <li>Contributed to novel approaches and implemented state-of-the-art methods for nuclei semantic segmentation as part of the Genentech Computer Vision R&D team.</li>
          </ul>
      </li>
      <li><b>Medical QA fine-tuning</b> with <a href="https://scholar.google.com/citations?user=tIub9CgAAAAJ&hl=en">Dr. Michael Wu</a>, <a href="https://scholar.google.com/citations?user=FWcdgEwAAAAJ&hl=en">Chloe Kim</a>, and <a href="https://scholar.google.com/citations?user=7JbGx6UAAAAJ&hl=en">Ayush Zenith</a> @ <a href="https://www.gene.com/">Genentech gRED</a>
          <ul>
            <li>July 2023 – December 2023</li>
            <li>Trained ensembles of language models and NER/RE models on large-scale in-house medical datasets.</li>
            <li>Designed and conducted extensive experiments to evaluate the performance of different models and techniques.</li>
          </ul>
      </li>
      <li><b>Long-form audio-visual understanding</b> with <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>September 2023 – December 2023</li>
            <li>Conducted extensive literature review to scope future research directions.</li>
            <li><a href="https://github.com/htahboub/pytorch-lfav">Re-implemented from scratch</a> papers like "<a href="https://arxiv.org/abs/2306.09431">Towards Long Form Audio-visual Video Understanding</a>" in PyTorch.</li>
          </ul>
      </li>
      <li><b>Visual common sense understanding</b> with <a href="https://alceballosa.github.io/">Alberto Mario Ceballos Arroyo</a> and Professors <a href="https://www.byronwallace.com/">Byron Wallace</a> and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>August 2022 – August 2023</li>
            <li>Focused first on visual question answering commonsense datasets and explored various approaches to solving the tasks.</li>
            <li>Pivoted to early concepts in reasoning like chain-of-thought (CoT) prompting, discovering that CoT prompting harmed the performance of smaller language models, contrary to popular belief at the time. We documented our findings in a <a href="assets/pdf/2023_preprint.pdf">preprint</a>.</li>
          </ul>
      </li>
    </ol>
  </div>
</div>

<script type='text/javascript' id='mapmyvisitors' src='https://mapmyvisitors.com/map.js?cl=0e1633&w=700&t=t&d=Zafdp7ft2cDE4aSunDpTfezHWG9zBmB8OkmxY7M4hIo&co=0b4975&cmo=2f840f&cmn=cc3a3a&ct=cdd4d9'></script>
<script>setTimeout(() => {document.getElementById("mapmyvisitors-widget").style.display = "none";}, 500);</script>
<!--You can find me on LinkedIn <a target="" href="https://linkedin.com/in/hamzatahboub">here</a> and my resume <a target="" href="https://hamzatahboub.com/resume.pdf">here</a>.-->
<!--If you're curious about my work or have potential opportunities and collaborations in mind, feel free to reach out!-->

<br>
