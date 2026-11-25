import fs from "node:fs";
import path from "node:path";

export type LinkItem = {
  label: string;
  href?: string;
  icon: string;
  active: boolean;
};

export type PublicationLink = {
  label: string;
  href: string;
};

export type Publication = {
  id: string;
  shortTitle: string;
  title: string;
  date: string;
  status: "accepted" | "preprint";
  featured: boolean;
  topic: string;
  meta: string;
  venues: string[];
  authors: string;
  note: string;
  image?: string;
  imageLabel?: string;
  imageFit?: "cover" | "contain";
  links: PublicationLink[];
  bibtex: string;
};

export type InterestItem = {
  title: string;
  detail: string;
  raw: string;
};

export type Experience = {
  date: string;
  title: string;
  text: string;
};

export type ExperienceGroup = {
  title: string;
  items: Experience[];
};

function readContent(file: string) {
  return fs.readFileSync(path.join(process.cwd(), "content", file), "utf8");
}

const homeMarkdown = readContent("home.md");
const newsMarkdown = readContent("news.md");
const experienceMarkdown = readContent("experience.md");

function getSection(markdown: string, title: string) {
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const heading = markdown.match(new RegExp(`^## ${escaped}\\s*\\n`, "m"));

  if (!heading || heading.index === undefined) {
    return "";
  }

  const sectionStart = heading.index + heading[0].length;
  const remaining = markdown.slice(sectionStart);
  const nextHeadingIndex = remaining.search(/^##\s+/m);
  const sectionEnd = nextHeadingIndex === -1 ? markdown.length : sectionStart + nextHeadingIndex;

  return markdown.slice(sectionStart, sectionEnd).trim();
}

function parseFields(block: string) {
  return Object.fromEntries(
    block
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.includes(":"))
      .map((line) => {
        const [key, ...rest] = line.split(":");
        return [key.trim(), rest.join(":").trim()];
      }),
  );
}

function parsePipeList(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).split("|").map((part) => part.trim()));
}

function parseSimpleList(block: string) {
  return block
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim());
}

function parseLinks(value = "") {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [label, href] = item.split("|").map((part) => part.trim());
      return { label, href };
    })
    .filter((item): item is PublicationLink => Boolean(item.label && item.href));
}

const BIB_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "for",
  "from",
  "in",
  "of",
  "on",
  "the",
  "to",
  "towards",
  "toward",
  "under",
  "via",
  "with",
]);

function extractShortTitle(title: string) {
  const colonIdx = title.indexOf(":");
  if (colonIdx > 0 && colonIdx <= 42) {
    return title.slice(0, colonIdx).trim();
  }
  const words = title.trim().split(/\s+/);
  return words.length <= 5 ? title.trim() : `${words.slice(0, 5).join(" ")}…`;
}

function slugifyTitle(title: string) {
  const prefix = title.includes(":") ? title.slice(0, title.indexOf(":")) : title.split(/\s+/).slice(0, 5).join(" ");
  const slug = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "paper";
}

function buildBibtex({
  title,
  authors,
  date,
  status,
  meta,
  links,
  usedKeys,
}: {
  title: string;
  authors: string;
  date: string;
  status: "accepted" | "preprint";
  meta: string;
  links: PublicationLink[];
  usedKeys: Set<string>;
}) {
  const cleanAuthors = authors
    .split(",")
    .map((name) => name.replace(/[*†‡]/g, "").trim())
    .filter(Boolean);

  const firstAuthorParts = (cleanAuthors[0] ?? "author").split(/\s+/);
  const lastName = (firstAuthorParts[firstAuthorParts.length - 1] ?? "author").toLowerCase().replace(/[^a-z0-9]/g, "") || "author";
  const yearMatch = meta.match(/\b(20\d{2})\b/) ?? date.match(/^(\d{4})/);
  const year = yearMatch?.[1] ?? "2026";
  const titleWords = title
    .split(/[:\s-]+/)
    .map((word) => word.toLowerCase().replace(/[^a-z0-9]/g, ""))
    .filter(Boolean);
  const keyword = titleWords.find((word) => !BIB_STOP_WORDS.has(word)) ?? titleWords[0] ?? "paper";

  let citeKey = `${lastName}${year}${keyword}`;
  let suffix = 2;
  while (usedKeys.has(citeKey)) {
    citeKey = `${lastName}${year}${keyword}${suffix}`;
    suffix += 1;
  }
  usedKeys.add(citeKey);

  const primaryVenue = meta.split("·")[0]?.trim() || "arXiv preprint";
  const paperUrl = links.find((link) => link.label.toLowerCase().includes("paper"))?.href ?? links[0]?.href ?? "";
  const entryType = status === "accepted" ? "inproceedings" : "article";
  const venueField = status === "accepted" ? `  booktitle = {${primaryVenue}},` : `  journal   = {${primaryVenue}},`;
  const urlField = paperUrl ? `\n  url       = {${paperUrl}},` : "";

  return `@${entryType}{${citeKey},
  title     = {${title}},
  author    = {${cleanAuthors.join(" and ")}},
${venueField}
  year      = {${year}},${urlField}
}`;
}

function parsePublications(markdown: string): Publication[] {
  const usedIds = new Set<string>();
  const usedKeys = new Set<string>();

  return markdown
    .split(/^## /m)
    .slice(1)
    .map((block) => {
      const [title = "", ...body] = block.trim().split("\n");
      const fields = parseFields(body.join("\n"));
      const cleanTitle = title.trim();
      const baseSlug = slugifyTitle(cleanTitle);
      let id = baseSlug;
      let idSuffix = 2;
      while (usedIds.has(id)) {
        id = `${baseSlug}-${idSuffix}`;
        idSuffix += 1;
      }
      usedIds.add(id);

      const status: "accepted" | "preprint" = fields.status === "accepted" ? "accepted" : "preprint";
      const meta = fields.meta ?? "";
      const venues = meta
        .split("·")
        .map((part) => part.trim())
        .filter(Boolean);
      const links = parseLinks(fields.links);
      const authors = fields.authors ?? "";
      const date = fields.date ?? "";

      return {
        id,
        shortTitle: fields.imageLabel?.trim() || extractShortTitle(cleanTitle),
        title: cleanTitle,
        date,
        status,
        featured: fields.featured === "true",
        topic: fields.topic ?? "General",
        meta,
        venues,
        authors,
        note: fields.note ?? "",
        image: fields.image,
        imageLabel: fields.imageLabel,
        imageFit: fields.imageFit === "cover" ? "cover" : "contain",
        links,
        bibtex: buildBibtex({ title: cleanTitle, authors, date, status, meta, links, usedKeys }),
      };
    });
}

const profileFields = parseFields(homeMarkdown.split("## Preface")[0]);
const prefaceFields = parseFields(getSection(homeMarkdown, "Preface"));

export const navigation = [
  { label: "About", href: "#about" },
  { label: "News", href: "#news" },
  { label: "Publications", href: "#publications" },
  { label: "Experience", href: "#experience" },
  { label: "Visitors", href: "#visitors" },
];

export const profile = {
  name: homeMarkdown.match(/^# (.+)$/m)?.[1] ?? "Zhe Cao",
  affiliation: profileFields.affiliation ?? "",
  role: profileFields.role ?? "",
  line: profileFields.line ?? "",
  note: profileFields.note ?? "",
};

export const preface = {
  eyebrow: prefaceFields.eyebrow ?? "Academic Portfolio",
  title: prefaceFields.title ?? "",
  text: prefaceFields.text ?? "",
};

export const profileLinks: LinkItem[] = parsePipeList(getSection(homeMarkdown, "Links")).map(([label, href, icon, state]) => ({
  label,
  href,
  icon,
  active: state === "active" && Boolean(href),
}));

export const intro = getSection(homeMarkdown, "About");

export const interests: InterestItem[] = parseSimpleList(getSection(homeMarkdown, "Research Interests")).map((raw) => {
  const separatorIndex = raw.indexOf("·");
  if (separatorIndex === -1) {
    return { title: raw, detail: "", raw };
  }
  return {
    title: raw.slice(0, separatorIndex).trim(),
    detail: raw.slice(separatorIndex + 1).trim(),
    raw,
  };
});

export const news = parsePipeList(newsMarkdown).map(([date, text]) => ({ date, text }));

export function getPublications(): Publication[] {
  return parsePublications(readContent("publications.md")).sort((left, right) => right.date.localeCompare(left.date));
}

export const experienceGroups: ExperienceGroup[] = experienceMarkdown
  .split(/^## /m)
  .slice(1)
  .map((block) => {
    const [title = "", ...body] = block.trim().split("\n");
    const items = parsePipeList(body.join("\n")).map(([date, itemTitle, text]) => ({
      date,
      title: itemTitle,
      text,
    }));

    return { title: title.trim(), items };
  });
