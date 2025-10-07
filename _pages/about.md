---
layout: about
title: about
permalink: /
subtitle: <a href='https://neu.edu'>Northeastern University</a>. Undergraduate.<br>tahboub.h [at] northeastern [dot] edu

profile:
  align: right
  image: pfp.png
  image_circular: true # crops the image to make it circular
  address:

news: false            # includes a list of news items
latest_posts: false    # includes a list of the newest posts
selected_papers: false # includes a list of papers marked as "selected={true}"
social: false          # includes social icons at the bottom of the page
---
<script>
    var pattern = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    var current = 0;
    var isTimePassed = false;

    var keyHandler = function (event) {
        if (isTimePassed || (pattern.indexOf(event.key) >= 0 && event.key === pattern[current])) {
            current++;
            if (pattern.length === current || isTimePassed) {
                current = 0;
                document.getElementById("howard").style.display = "block";
                document.getElementById("gaster").style.display = "block";
            }
        } else {
            current = 0;
        }
    };

    document.addEventListener('keydown', keyHandler, false);

    function checkTime() {
        isTimePassed = true;
        document.getElementById("howard").style.display = "block";
        document.getElementById("gaster").style.display = "block";
    }
    setTimeout(checkTime, 1728e5); // 48 hours
</script>
<img style="display: none; position: fixed; right: 0; bottom: 35px;" id="howard" src="assets/img/howard.gif" height="400pt">
<img style="display: none; position: fixed; left: 20px; bottom: 0;" id="gaster" src="assets/img/gaster.gif" height="400pt">
Hello! My name is Hamza and I am a computer science & math major at Northeastern University's [Khoury College of Computer Sciences](https://www.khoury.northeastern.edu/).

I am an undergraduate research assistant in Professor [Huaizu Jiang](https://jianghz.me/)'s Visual Intelligence lab at Northeastern University. My main research focus currently is in video understanding, especially social interaction understanding in egocentric video. Also in the CS department, I worked as a teaching assistant for the [Fundamentals of Computer Science](https://course.ccs.neu.edu/cs2500/) (CS 2500) course for a couple of semesters.

<style>
.flex-container {
  display: flex;
  padding: 5px 20px;
}
.column {
  flex: 1;
  padding: 0 13px;
}
</style>

<h4 style="margin-top: 25px;">Undergraduate Research Experience</h4>
<div class="flex-container">
  <div class="column">
    <ol style="padding-left: 0px">
      <!--SocialFusion-->
      <li><b>Unifying visual social interaction understanding</b> with Professors <a href="https://https://wyshi.github.io/">Weiyan Shi</a>, <a href="https://www.ganghua.org/">Gang Hua</a>, and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>February 2025 – September 2025</li>
            <li><u>Paper currently under review.</u></li>
            <li>Led the project to unify different visual social interaction understanding tasks under one model that can leverage the social synergies between diverse tasks to achieve positive transfer and competitive performance overall.</li>
            <li>Also revealed that popular VLMs of the same scale suffer from a degradation that impairs their social understanding and leads to negative transfer.</li>
          </ul>
      </li>
      <li><b>OneGaze</b> with <a href="https://www.linkedin.com/in/joseph-y-gu">Joseph Gu</a> and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>June 2025 – Present</li>
            <li>Co-leading a project to develop an architecture that unifies two distinct gaze estimation tasks: image scanpath prediction and video saliency prediction.</li>
            <li>These tasks are closely related as they both ultimately model people's attention shifts while observing visual media.</li>
          </ul>
      </li>
      <li><b>Egocentric Werewolf strategy classification and utterance prediction</b> with <a href="https://scholar.google.com/citations?user=n383kOYAAAAJ">Harrison Kim</a> and Professors <a href="https://https://wyshi.github.io/">Weiyan Shi</a> and <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>January 2024 – January 2025</li>
            <li>Led a project to understand subtle social cues from an egocentric perspective.</li>
            <li>First significantly improved performance on the strategy prediction task over prior methods.</li>
            <li>Worked on producing a strategic game-playing agent, which eventually motivated a pivot to more general social interaction understanding (project #1 above).</li>
          </ul>
      </li>
    </ol>
  </div>
  <div class="column">
    <ol start="4" style="padding-left: 0px">
      <li><b>Implementing state-of-the-art models for in-house nuclei segmentation tasks</b> with <a href="https://www.linkedin.com/in/evanliu518/">Evan Liu</a> and <a href="https://scholar.google.com/citations?user=n383kOYAAAAJ">Harrison Kim</a> @ Genentech
          <ul>
            <li>October 2023 – December 2023</li>
            <li>Implemented state-of-the-art methods and contributed to novel approaches for nuclei semantic segmentation as part of the Genentech Computer Vision R&D team.</li>
          </ul>
      </li>
      <li><b>Medical QA fine-tuning</b> with <a href="https://scholar.google.com/citations?user=tIub9CgAAAAJ&hl=en">Dr. Michael Wu</a>, <a href="https://scholar.google.com/citations?user=FWcdgEwAAAAJ&hl=en">Chloe Kim</a>, and <a href="https://scholar.google.com/citations?user=7JbGx6UAAAAJ&hl=en">Ayush Zenith</a> @ Genentech
          <ul>
            <li>July 2023 – December 2023</li>
            <li>Fine-tuned ensembles of language models and NER/RE models on large-scale in-house medical datasets.</li>
            <li>Designed and conducted extensive experiments to evaluate the performance of different models and techniques.</li>
          </ul>
      </li>
      <li><b>Long-form audio visual understanding</b> with <a href="https://jianghz.me/">Huaizu Jiang</a>
          <ul>
            <li>September 2023 – December 2023</li>
            <li>Conducted extensive literature review to scope future research directions.</li>
            <li><a href="https://github.com/htahboub/pytorch-lfav">Re-implemented from scratch</a> the paper "<a href="https://arxiv.org/abs/2306.09431">Towards Long Form Audio-visual Video Understanding</a>" in PyTorch.</li>
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

<!--You can find me on LinkedIn <a target="" href="https://linkedin.com/in/hamzatahboub">here</a> and my resume <a target="" href="https://hamzatahboub.com/resume.pdf">here</a>.-->
<!--If you're curious about my work or have potential opportunities and collaborations in mind, feel free to reach out!-->

<br>
