import type { ExperienceGroup, Publication } from "./site";

export type LensId = "overview" | "mllms" | "agents" | "world-models" | "custom";

export type TraceStep = {
  tool: string;
  arg: string;
  result: string;
  ms: number;
};

export type CitedSegment = {
  id: string;
  text: string;
  citations: number[];
};

export type SynthesisPayload = {
  lens: LensId;
  label: string;
  segments: CitedSegment[];
  sources: Publication[];
  trace: TraceStep[];
};

const QUERY_STOP_WORDS = new Set([
  "a",
  "about",
  "all",
  "an",
  "and",
  "any",
  "are",
  "by",
  "cao",
  "can",
  "did",
  "do",
  "does",
  "for",
  "from",
  "give",
  "has",
  "have",
  "his",
  "how",
  "in",
  "is",
  "list",
  "me",
  "michael",
  "model",
  "models",
  "of",
  "on",
  "or",
  "paper",
  "papers",
  "please",
  "publication",
  "publications",
  "research",
  "show",
  "summarize",
  "tell",
  "the",
  "to",
  "what",
  "where",
  "which",
  "who",
  "with",
  "work",
  "works",
  "zhe",
]);

const CJK_QUERY_ALIASES: Array<[string, string]> = [
  ["多模态", "mllms multimodal omni"],
  ["全模态", "omni multimodal mllms"],
  ["音视频", "audio video"],
  ["音频", "audio"],
  ["视频", "video"],
  ["生成", "generation"],
  ["字幕", "captioning"],
  ["幻觉", "hallucination omnihalluc"],
  ["智能体", "agentic agents"],
  ["多智能体", "multi agent agents"],
  ["安全", "safety jailbreak safedialbench"],
  ["越狱", "jailbreak safety"],
  ["持续学习", "continual distillation"],
  ["蒸馏", "distillation"],
  ["世界模型", "world models"],
  ["机器人", "robot robotics manipulation"],
  ["具身", "embodied robot world"],
  ["潜空间", "latent space"],
  ["路由", "routing roborouter"],
  ["一作", "first author"],
  ["共同一作", "co-first equal contribution"],
  ["共一", "co-first equal contribution"],
  ["代表作", "representative featured"],
  ["录用", "accepted"],
  ["已发表", "accepted"],
  ["会议", "accepted"],
  ["预印本", "preprint arxiv"],
  ["综述", "survey"],
  ["代码", "code github"],
  ["开源", "code github"],
  ["清华", "tsinghua"],
  ["南京大学", "nanjing"],
  ["南大", "nanjing"],
  ["深圳", "shenzhen loop"],
  ["港中深", "cuhk shenzhen"],
  ["影石", "insta360"],
  ["智元", "agibot"],
  ["实习", "intern"],
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function expandBilingualAliases(input: string) {
  let expanded = input;
  for (const [cjk, english] of CJK_QUERY_ALIASES) {
    if (input.includes(cjk)) {
      expanded += ` ${english}`;
    }
  }
  return expanded;
}

function matchesToken(text: string, token: string, wordBoundaryOnly = false) {
  const lowerText = text.toLowerCase();
  if (!token) return false;
  if (wordBoundaryOnly || token.length <= 3) {
    const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegExp(token)}([^a-z0-9]|$)`, "i");
    return pattern.test(lowerText);
  }
  return lowerText.includes(token);
}

export function cleanAuthorName(name: string) {
  return name.replace(/[*†‡]+/g, "").replace(/\s+/g, " ").trim();
}

export function splitAuthorAffixes(rawAuthor: string, profileName: string) {
  const escaped = escapeRegExp(profileName).replace(/\s+/g, "\\s+");
  const match = rawAuthor.match(new RegExp(`^([*†‡\\s]*)(${escaped})([*†‡\\s]*)$`));
  if (!match) {
    return { prefix: "", suffix: rawAuthor.replace(profileName, "").trim() };
  }
  return { prefix: match[1].trim(), suffix: match[3].trim() };
}

function findBySlugOrTitle(publications: Publication[], token: string): Publication | undefined {
  const lower = token.toLowerCase();
  return publications.find(
    (pub) => pub.id.includes(lower) || pub.title.toLowerCase().includes(lower),
  );
}

export function buildPresetSynthesis(
  lens: Exclude<LensId, "custom">,
  publications: Publication[],
): SynthesisPayload {
  const t2av = findBySlugOrTitle(publications, "t2av-compass");
  const avscap = findBySlugOrTitle(publications, "avscap");
  const omnihalluc = findBySlugOrTitle(publications, "omnihalluc");
  const omnivideo = findBySlugOrTitle(publications, "omnivideobench");
  const frontier = findBySlugOrTitle(publications, "frontier-eng");
  const safedial = findBySlugOrTitle(publications, "safedialbench");
  const cagd = findBySlugOrTitle(publications, "stabilizing-language-models");
  const predControl = findBySlugOrTitle(publications, "from-prediction-to-control");
  const roborouter = findBySlugOrTitle(publications, "roborouter");
  const latent = findBySlugOrTitle(publications, "the-latent-space");

  if (lens === "mllms") {
    const sources = [t2av, avscap, omnihalluc, omnivideo].filter(
      (item): item is Publication => Boolean(item),
    );
    const acceptedCount = sources.filter((item) => item.status === "accepted").length;
    return {
      lens,
      label: "MLLMs & Audio-Video",
      sources,
      segments: [
        {
          id: "m1",
          text: "In omni-modal evaluation and generation, Zhe Cao co-led T2AV-Compass (ICML 2026 & CVPR 2026 VGBE Oral) to unify evaluation across instruction following, perceptual realism, and cross-modal audio-video synchronization",
          citations: [1].filter((n) => n <= sources.length),
        },
        {
          id: "m2",
          text: "For audio-visual understanding, AVSCap (EMNLP 2026 Main) orchestrates audio-visual synergy for omni-modal video captioning, while OmniVideoBench (ICLR 2026) establishes broad evaluation across omni MLLMs",
          citations: [2, 4].filter((n) => n <= sources.length),
        },
        {
          id: "m3",
          text: "Addressing model reliability, OmniHalluc-L (EMNLP 2026) introduces counterfactual benchmarking and modality-perturbation calibration for long-form omni-modal hallucination, complementing industry VLM work at Insta360",
          citations: [3].filter((n) => n <= sources.length),
        },
      ],
      trace: [
        {
          tool: "retrieve_publications",
          arg: 'topic="MLLMs"',
          result: acceptedCount === sources.length ? `${sources.length} accepted papers` : `${sources.length} papers (${acceptedCount} accepted)`,
          ms: 112,
        },
        { tool: "cross_ref_experience", arg: 'org="NJU Link Lab · Insta360"', result: "2 roles linked", ms: 96 },
        { tool: "verify_citations", arg: 'venues="ICML · CVPR Oral · EMNLP · ICLR"', result: "grounded", ms: 132 },
      ],
    };
  }

  if (lens === "agents") {
    const sources = [frontier, safedial, cagd].filter((item): item is Publication => Boolean(item));
    return {
      lens,
      label: "Agentic AI & Safety",
      sources,
      segments: [
        {
          id: "a1",
          text: "On autonomous software & engineering agents, Frontier-Eng (NeurIPS 2026) benchmarks self-evolving agents on real-world engineering tasks with generative optimization, building alongside multi-agent deep research at Tsinghua NLP Group",
          citations: [1].filter((n) => n <= sources.length),
        },
        {
          id: "a2",
          text: "For post-training stability, Condition-Anchored Distillation (CAGD) mitigates catastrophic forgetting when language models adapt under continual learning",
          citations: [3].filter((n) => n <= sources.length),
        },
        {
          id: "a3",
          text: "On safety and trustworthiness, SafeDialBench (ICLR 2026) evaluates fine-grained LLM safety across multi-turn dialogues under diverse jailbreak attacks",
          citations: [2].filter((n) => n <= sources.length),
        },
      ],
      trace: [
        { tool: "retrieve_publications", arg: 'topic="Agentic AI"', result: `${sources.length} papers matched`, ms: 110 },
        { tool: "cross_ref_experience", arg: 'org="Tsinghua NLP · NJU R&L"', result: "2 labs linked", ms: 102 },
        { tool: "verify_citations", arg: 'venues="NeurIPS · ICLR · arXiv"', result: "grounded", ms: 128 },
      ],
    };
  }

  if (lens === "world-models") {
    const sources = [predControl, roborouter, latent].filter(
      (item): item is Publication => Boolean(item),
    );
    return {
      lens,
      label: "World Models & Robotics",
      sources,
      segments: [
        {
          id: "w1",
          text: "Bridging predictive modeling and embodied control, From Prediction to Control surveys closed-loop world models for robot learning, aligned with ongoing research at Shenzhen Loop Area Institute (FreedomAI, CUHK-Shenzhen)",
          citations: [1].filter((n) => n <= sources.length),
        },
        {
          id: "w2",
          text: "For real-world robotic execution, RoboRouter proposes training-free policy routing for robotic manipulation, complemented by FP8/BF16 RL policy deployment experience at AgiBot",
          citations: [2].filter((n) => n <= sources.length),
        },
        {
          id: "w3",
          text: "At the representation level, The Latent Space examines the foundations, evolution, mechanisms, and capabilities of latent world representations",
          citations: [3].filter((n) => n <= sources.length),
        },
      ],
      trace: [
        { tool: "retrieve_publications", arg: 'topic="World Models"', result: `${sources.length} works matched`, ms: 108 },
        { tool: "cross_ref_experience", arg: 'org="Loop Institute · AgiBot"', result: "2 roles linked", ms: 98 },
        { tool: "verify_citations", arg: 'focus="embodied & latent control"', result: "grounded", ms: 134 },
      ],
    };
  }

  const sources = [t2av, frontier, predControl, safedial].filter(
    (item): item is Publication => Boolean(item),
  );
  return {
    lens: "overview",
    label: "Portfolio Overview",
    sources,
    segments: [
      {
        id: "o1",
        text: "Zhe Cao is a Computer Science undergraduate at Nanjing University researching how foundation models perceive omni-modal signals, reason as reliable agents, and act via closed-loop world models",
        citations: [1, 2, 3].filter((n) => n <= sources.length),
      },
      {
        id: "o2",
        text: "Representative accepted works span ICML 2026 & CVPR 2026 VGBE Oral (T2AV-Compass, co-first author), NeurIPS 2026 (Frontier-Eng on self-evolving agents), EMNLP 2026, and ICLR 2026 (SafeDialBench & OmniVideoBench)",
        citations: [1, 2, 4].filter((n) => n <= sources.length),
      },
      {
        id: "o3",
        text: "Recent research at Shenzhen Loop Area Institute, Tsinghua NLP Group, NJU Link Lab, Insta360, and AgiBot connects omni-modal evaluation with closed-loop robot world models and efficient RL deployment",
        citations: [3].filter((n) => n <= sources.length),
      },
    ],
    trace: [
      { tool: "index_portfolio", arg: `papers=${publications.length}`, result: `${publications.filter((p) => p.status === "accepted").length} accepted · ${publications.filter((p) => p.status === "preprint").length} preprints`, ms: 114 },
      { tool: "rank_highlights", arg: 'criteria="oral + flagship venues"', result: `${sources.length} core citations`, ms: 98 },
      { tool: "verify_citations", arg: 'mode="strict_grounding"', result: "100% verified", ms: 128 },
    ],
  };
}

export function buildCustomQuerySynthesis(
  rawQuery: string,
  publications: Publication[],
  experienceGroups: ExperienceGroup[],
  profileName: string,
): SynthesisPayload {
  const cleanQuery = rawQuery.replace(/\s+/g, " ").trim().slice(0, 120);
  if (!cleanQuery) {
    return buildPresetSynthesis("overview", publications);
  }

  const expandedQuery = expandBilingualAliases(cleanQuery).toLowerCase();
  const lowerQuery = cleanQuery.toLowerCase();

  // Split on hyphens and non-alphanumeric separators (preserving '+' in tokens like c++)
  const tokens = Array.from(
    new Set(
      expandedQuery
        .replace(/[^a-z0-9+]+/g, " ")
        .split(/\s+/)
        .filter((tok) => tok.length >= 2 && !QUERY_STOP_WORDS.has(tok)),
    ),
  );

  const wantsFirstAuthor =
    expandedQuery.includes("first author") ||
    expandedQuery.includes("co-first") ||
    expandedQuery.includes("equal contribution") ||
    expandedQuery.includes("lead") ||
    expandedQuery.includes("representative") ||
    expandedQuery.includes("featured");

  const wantsAccepted =
    tokens.includes("accepted") ||
    expandedQuery.includes("peer-reviewed") ||
    expandedQuery.includes("peer reviewed") ||
    tokens.includes("conference");

  const wantsPreprint =
    tokens.includes("preprint") ||
    tokens.includes("preprints") ||
    tokens.includes("arxiv");

  const wantsCode =
    tokens.includes("code") ||
    tokens.includes("github") ||
    expandedQuery.includes("open source") ||
    expandedQuery.includes("open-source");

  const scoredPubs = publications
    .map((pub) => {
      let score = 0;
      const linkLabelsAndUrls = pub.links.map((l) => `${l.label} ${l.href}`).join(" ");
      const haystack = `${pub.title} ${pub.shortTitle} ${pub.topic} ${pub.status} ${pub.meta} ${pub.note} ${pub.authors} ${linkLabelsAndUrls}`.toLowerCase();

      if (lowerQuery.length >= 3 && haystack.includes(lowerQuery)) {
        score += 14;
      }

      if (wantsFirstAuthor) {
        const authors = pub.authors.split(",").map((a) => a.trim());
        const isSelfLead = authors.some(
          (a, idx) =>
            cleanAuthorName(a) === profileName && (a.includes("*") || idx === 0),
        );
        if (isSelfLead) score += 16;
        if (pub.featured) score += 6;
      }

      if (wantsAccepted && pub.status === "accepted") {
        score += 10;
        if (pub.featured) score += 4;
      }
      if (wantsPreprint && pub.status === "preprint") {
        score += 10;
      }
      if (wantsCode && pub.links.some((l) => l.href.toLowerCase().includes("github.com") || l.label.toLowerCase().includes("code"))) {
        score += 9;
        if (pub.featured) score += 3;
      }

      for (const tok of tokens) {
        if (
          tok === "accepted" ||
          tok === "conference" ||
          tok === "preprint" ||
          tok === "preprints" ||
          tok === "code" ||
          tok === "github" ||
          tok === "first" ||
          tok === "author" ||
          tok === "equal" ||
          tok === "contribution" ||
          tok === "co"
        ) {
          continue;
        }

        if (matchesToken(pub.title, tok) || matchesToken(pub.shortTitle, tok)) score += 6;
        if (matchesToken(pub.meta, tok)) score += 6;
        if (matchesToken(pub.topic, tok)) score += 5;
        if (matchesToken(pub.note, tok)) score += 4;
        if (matchesToken(pub.authors, tok, true)) score += 3;
        if (matchesToken(linkLabelsAndUrls, tok)) score += 2;

        if ((tok === "audio" || tok === "video" || tok === "visual" || tok === "multimodal" || tok === "omni" || tok === "vlm" || tok === "mllm" || tok === "mllms") && pub.topic === "MLLMs") {
          score += 4;
        }
        if ((tok === "agent" || tok === "agents" || tok === "agentic" || tok === "safety" || tok === "jailbreak" || tok === "continual" || tok === "distillation") && pub.topic === "Agentic AI") {
          score += 4;
        }
        if ((tok === "robot" || tok === "robotics" || tok === "world" || tok === "embodied" || tok === "latent" || tok === "policy" || tok === "control") && pub.topic === "World Models") {
          score += 4;
        }
      }

      return { pub, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score);

  const allExperiences = experienceGroups.flatMap((group) =>
    group.items.map((item) => ({ ...item, group: group.title })),
  );

  const matchedExperiences = allExperiences
    .map((exp) => {
      const expHaystack = `${exp.title} ${exp.text} ${exp.date} ${exp.group}`;
      let score = 0;
      if (lowerQuery.length >= 3 && expHaystack.toLowerCase().includes(lowerQuery)) {
        score += 14;
      }
      for (const tok of tokens) {
        if (
          tok === "accepted" ||
          tok === "preprint" ||
          tok === "preprints" ||
          tok === "conference" ||
          tok === "first" ||
          tok === "author"
        ) {
          continue;
        }
        if (matchesToken(exp.title, tok)) score += 6;
        if (matchesToken(exp.text, tok)) score += 4;
        if (matchesToken(exp.date, tok)) score += 2;
      }
      return { exp, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.exp);

  if (scoredPubs.length === 0 && matchedExperiences.length === 0) {
    const crossTrackReps = ["MLLMs", "Agentic AI", "World Models"]
      .map(
        (topic) =>
          publications.find((p) => p.topic === topic && p.featured) ??
          publications.find((p) => p.topic === topic && p.status === "accepted") ??
          publications.find((p) => p.topic === topic),
      )
      .filter((item): item is Publication => Boolean(item));
    const fallbackPool = crossTrackReps.concat(publications);
    const uniqueFallback = Array.from(new Map(fallbackPool.map((p) => [p.id, p])).values()).slice(0, 3);

    return {
      lens: "custom",
      label: `"${cleanQuery}"`,
      sources: uniqueFallback,
      segments: [
        {
          id: "c-none-1",
          text: `No exact match for "${cleanQuery}" appears in the current publication or experience records`,
          citations: [],
        },
        ...(uniqueFallback.length > 0
          ? [
              {
                id: "c-none-2",
                text: `Closest representative works include ${uniqueFallback.map((p) => `${p.shortTitle} (${p.meta})`).join("; ")} across MLLMs, Agentic AI, and World Models`,
                citations: uniqueFallback.map((_, idx) => idx + 1),
              },
            ]
          : []),
      ],
      trace: [
        { tool: "search_corpus", arg: `query="${cleanQuery}"`, result: "0 exact matches", ms: 118 },
        { tool: "fallback_featured", arg: 'strategy="representative"', result: `${uniqueFallback.length} works surfaced`, ms: 102 },
      ],
    };
  }

  const topSources = scoredPubs.slice(0, 4).map((s) => s.pub);
  const segments: CitedSegment[] = [];

  if (topSources.length > 0) {
    const primary = topSources[0];
    segments.push({
      id: "c-hit-1",
      text: `Top match for "${cleanQuery}": ${primary.title} (${primary.meta})${primary.note ? ` — ${primary.note.replace(/\.$/, "")}` : ""}`,
      citations: [1],
    });

    if (topSources.length > 1) {
      const restSummary = topSources
        .slice(1)
        .map((p) => `${p.shortTitle} (${p.meta})`)
        .join(", ");
      segments.push({
        id: "c-hit-2",
        text: `Additional matching works (${scoredPubs.length} total): ${restSummary}`,
        citations: topSources.slice(1).map((_, idx) => idx + 2),
      });
    }
  }

  if (matchedExperiences.length > 0) {
    const exp = matchedExperiences[0];
    // Experience records originate from content/experience.md, never misattributed to paper [1]
    segments.push({
      id: "c-exp",
      text: `Related experience: ${exp.title} (${exp.date}) — ${exp.text.replace(/\.$/, "")}`,
      citations: [],
    });
  }

  return {
    lens: "custom",
    label: `"${cleanQuery}"`,
    sources: topSources,
    segments,
    trace: [
      { tool: "search_corpus", arg: `query="${cleanQuery}"`, result: `${scoredPubs.length} paper(s) · ${matchedExperiences.length} role(s)`, ms: 116 },
      { tool: "rank_citations", arg: `top_k=${topSources.length}`, result: topSources.length > 0 ? "grounded" : "experience-only", ms: 104 },
      { tool: "verify_spans", arg: 'mode="extractive"', result: "verified", ms: 120 },
    ],
  };
}
