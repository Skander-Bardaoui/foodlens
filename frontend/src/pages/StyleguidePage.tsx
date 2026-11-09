import {
  Camera,
  ChefHat,
  History,
  ImageUp,
  ScanEye,
  ScanLine,
  ScrollText,
  Search,
  Sparkles,
  Timer,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";

import Badge, { ConfidenceBadge, StatusDot } from "../components/Badge";
import Button from "../components/Button";
import Card from "../components/Card";
import Chip from "../components/Chip";
import ConfirmDialog from "../components/ConfirmDialog";
import DropZone from "../components/DropZone";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import IconButton from "../components/IconButton";
import IngredientsList from "../components/IngredientsList";
import ProgressBars from "../components/ProgressBars";
import ProgressSteps from "../components/ProgressSteps";
import SectionTitle from "../components/SectionTitle";
import SkeletonCard from "../components/SkeletonCard";
import StepCard from "../components/StepCard";
import StepsList from "../components/StepsList";
import Toast from "../components/Toast";
import type { ToastTone } from "../components/Toast";

const colorTokens = [
  { name: "brand", value: "#f97316", className: "bg-brand" },
  { name: "brand-deep", value: "#9d4300", className: "bg-brand-deep" },
  { name: "brand-soft", value: "#ffdbca", className: "bg-brand-soft" },
  { name: "accent", value: "#16a34a", className: "bg-accent" },
  { name: "accent-soft", value: "#7cf994", className: "bg-accent-soft" },
  { name: "warning", value: "#d78900", className: "bg-warning" },
  { name: "danger", value: "#ba1a1a", className: "bg-danger" },
  { name: "surface", value: "#f8f9ff", className: "bg-surface border border-hairline" },
  { name: "surface-low", value: "#eff4ff", className: "bg-surface-low" },
  { name: "surface-high", value: "#dee9fc", className: "bg-surface-high" },
  { name: "ink", value: "#121c2a", className: "bg-ink" },
  { name: "muted", value: "#584237", className: "bg-muted" },
];

const typingScale = [
  { name: "display-hero", className: "text-display-hero-mobile md:text-display-hero" },
  { name: "headline-lg", className: "text-headline-lg-mobile md:text-headline-lg" },
  { name: "headline-md", className: "text-headline-md" },
  { name: "headline-sm", className: "text-headline-sm" },
  { name: "body-lg", className: "text-body-lg" },
  { name: "body-md", className: "text-body-md" },
  { name: "body-sm", className: "text-body-sm" },
  { name: "label-lg", className: "text-label-lg" },
  { name: "label-md", className: "text-label-md" },
  { name: "label-sm", className: "text-label-sm uppercase tracking-wide" },
];

const ingredients = [
  { id: "flour", label: "250g '00' Tipo Flour", tag: "Dough", tagTone: "neutral" as const, checked: true },
  { id: "water", label: "160ml lukewarm filtered water", tag: "Dough", tagTone: "neutral" as const, checked: true },
  { id: "mozzarella", label: "125g fresh buffalo mozzarella", tag: "Key Tag", tagTone: "brand" as const },
  { id: "tomato", label: "80g San Marzano crushed tomatoes", tag: "Sauce", tagTone: "neutral" as const },
  { id: "basil", label: "4–5 fresh sweet basil leaves", tag: "Fresh", tagTone: "success" as const },
  { id: "oil", label: "1 tbsp extra virgin olive oil", tag: "Oil", tagTone: "neutral" as const },
];

const recipeSteps = [
  {
    title: "Prepare & ferment the dough",
    description:
      "Mix flour, water, yeast and salt. Knead for 10 minutes, then proof for 2 hours until doubled in volume.",
  },
  {
    title: "Shape & stretch",
    description:
      "Stretch by hand from the centre outward, keeping the puffy cornicione intact. Never use a rolling pin.",
  },
  {
    title: "Sauce & cheese",
    description:
      "Spoon crushed tomatoes in gentle spirals, scatter torn mozzarella and finish with olive oil.",
  },
];

const sampleDishes = ["Avocado Toast 98%", "Tonkotsu Ramen 95%", "Quinoa Greek Bowl 92%", "Acai Super Bowl 99%"];

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <SectionTitle title={title} description={description} eyebrow={id} />
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function StyleguidePage() {
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState<{ open: boolean; tone: ToastTone }>({
    open: false,
    tone: "success",
  });
  const [dialogOpen, setDialogOpen] = useState(false);

  const showToast = (tone: ToastTone) => setToast({ open: true, tone });

  const toastCopy: Record<ToastTone, { title: string; description: string }> = {
    success: { title: "Recipe saved", description: "Margherita Pizza is now in your favorites." },
    warning: { title: "Low confidence match", description: "54% match — try another angle for better results." },
    danger: { title: "Upload failed", description: "The image is larger than 5 MB. Please compress it." },
    info: { title: "Analysis queued", description: "We'll notify you as soon as the recipe is ready." },
  };

  return (
    <div className="flex flex-col gap-14">
      <header>
        <p className="font-body text-label-sm font-bold uppercase tracking-widest text-brand-deep">
          Design system · Warm Culinary Modern
        </p>
        <h1 className="mt-2 font-display text-display-hero-mobile font-extrabold tracking-tight text-ink md:text-display-hero">
          The FoodLens <span className="text-brand">UI kit</span>
        </h1>
        <p className="mt-3 max-w-2xl font-body text-body-md text-muted md:text-body-lg">
          Tokens and components extracted from the Stitch export. This route is a temporary
          reference for both client and mobile breakpoints.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Badge tone="brand" uppercase>AI Beta</Badge>
          <Badge tone="success" icon={<StatusDot tone="success" />}>92% confidence</Badge>
          <Badge tone="warning" icon={<Timer className="h-3.5 w-3.5" />}>Prep 25m</Badge>
          <Badge tone="danger">Needs review</Badge>
          <Badge tone="neutral">Italian</Badge>
        </div>
      </header>

      <Section id="colors" title="Color tokens" description="Culinary warmth with analytical green, amber and red confidence layers.">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {colorTokens.map((token) => (
            <div key={token.name} className="overflow-hidden rounded-control border border-hairline/70 bg-surface-lowest shadow-card">
              <div className={`h-16 w-full ${token.className}`} />
              <div className="p-3">
                <p className="font-body text-label-md font-semibold text-ink">{token.name}</p>
                <p className="font-body text-label-sm uppercase text-muted-soft">{token.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section id="typography" title="Typography" description="Plus Jakarta Sans for display, Inter for body and data.">
        <Card padding="lg" className="flex flex-col gap-4">
          {typingScale.map((type) => (
            <div key={type.name} className="flex flex-col gap-1 border-b border-hairline/60 pb-3 last:border-0 last:pb-0">
              <span className="font-body text-label-sm uppercase tracking-widest text-muted-soft">{type.name}</span>
              <p className={`font-display text-ink ${type.className}`}>Mise en place for every plate</p>
            </div>
          ))}
        </Card>
      </Section>

      <Section id="buttons" title="Buttons & icon buttons" description="Pill actions with primary, secondary, outline, ghost and danger variants.">
        <Card padding="lg" className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button leftIcon={<Camera className="h-4 w-4" />}>Scan Meal</Button>
            <Button variant="secondary" leftIcon={<History className="h-4 w-4" />}>Review history</Button>
            <Button variant="outline" leftIcon={<Sparkles className="h-4 w-4" />}>Generate recipe</Button>
            <Button variant="ghost">Skip for now</Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>Delete</Button>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large action</Button>
            <Button loading>Saving</Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" rightIcon={<Sparkles className="h-4 w-4" />}>
              With right icon
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <IconButton label="Search" icon={<Search className="h-5 w-5" />} />
            <IconButton label="Favorite" tone="brand" icon={<ChefHat className="h-5 w-5" />} />
            <IconButton label="Delete" tone="danger" icon={<Trash2 className="h-5 w-5" />} />
            <IconButton label="Small icon" size="sm" icon={<ScanLine className="h-4 w-4" />} />
          </div>
        </Card>
      </Section>

      <Section id="chips" title="Chips & filters" description="Filter pills selected in solid citrus orange, exactly like the history screen.">
        <Card padding="lg" className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All", count: 18 },
            { id: "high", label: "High confidence", count: 15 },
            { id: "favorites", label: "Favorites", count: 7 },
            { id: "review", label: "Needs review", count: 3 },
          ].map((item) => (
            <Chip
              key={item.id}
              selected={filter === item.id}
              count={item.count}
              icon={item.id === "favorites" ? <ChefHat className="h-4 w-4" /> : undefined}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Chip>
          ))}
        </Card>
      </Section>

      <Section id="badges" title="Badges & confidence" description="Green at 75%+, amber from 40–74%, red below 40%.">
        <Card padding="lg" className="flex flex-wrap items-center gap-3">
          <ConfidenceBadge value={0.92} />
          <ConfidenceBadge value={0.54} />
          <ConfidenceBadge value={0.32} />
          <Badge tone="brand" uppercase>AI Beta</Badge>
          <Badge tone="success" icon={<StatusDot tone="success" />}>Verified recipe</Badge>
          <Badge tone="warning" uppercase>Needs confirmation</Badge>
          <Badge tone="danger">Error 500</Badge>
          <Badge tone="neutral">Vegetarian</Badge>
        </Card>
      </Section>

      <Section id="step-cards" title="Step cards" description="Bento-style onboarding cards with oversized ghost numbering.">
        <div className="grid gap-4 md:grid-cols-3">
          <StepCard step={1} title="Snap your plate" description="Use natural light and a top-down or 45° angle for the sharpest recognition." icon={Camera} accent="brand" />
          <StepCard step={2} title="AI identifies it" description="Our Food-101 vision model scores the dish and surfaces confidence instantly." icon={ScanEye} accent="warning" />
          <StepCard step={3} title="Cook the recipe" description="Follow generated steps, track ingredients and save the result to history." icon={ScrollText} accent="accent" />
        </div>
      </Section>

      <Section id="dropzone" title="Dropzone" description="Idle, preview and error states. Drag-over tints the dashed frame orange live.">
        <div className="grid gap-4 lg:grid-cols-3">
          <div>
            <p className="mb-2 font-body text-label-sm uppercase tracking-wider text-muted-soft">Idle</p>
            <DropZone onFiles={() => undefined} />
          </div>
          <div>
            <p className="mb-2 font-body text-label-sm uppercase tracking-wider text-muted-soft">With preview</p>
            <DropZone previewName="IMG_4092_woodfire.jpg" onClear={() => undefined} />
          </div>
          <div>
            <p className="mb-2 font-body text-label-sm uppercase tracking-wider text-muted-soft">Error</p>
            <DropZone error="That file isn't a JPG, PNG or WEBP under 5 MB." />
          </div>
        </div>
      </Section>

      <Section id="progress" title="Predictions & pipeline" description="Top-3 model bars and the three-stage analysis tracker.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <SectionTitle
              title="Visual model predictions"
              icon={<Sparkles className="h-5 w-5" />}
              action={<span className="font-body text-label-sm uppercase tracking-wider text-muted-soft">ResNet-Culinary</span>}
            />
            <ProgressBars
              className="mt-5"
              predictions={[
                { label: "Margherita Pizza", value: 0.92 },
                { label: "Neapolitan Marinara", value: 0.05 },
                { label: "Quattro Formaggi", value: 0.03 },
              ]}
            />
          </Card>
          <Card padding="lg">
            <SectionTitle
              title="Culinary pipeline"
              action={<span className="font-body text-label-sm font-semibold uppercase tracking-wider text-brand">Stage 1 of 3</span>}
            />
            <ProgressSteps
              className="mt-5"
              current={0}
              steps={[
                { title: "Recognizing the dish", description: "Scanning texture, crust patterns and toppings…" },
                { title: "Finding ingredients", description: "Extracting basil, mozzarella and San Marzano tomatoes…" },
                { title: "Writing the recipe", description: "Formulating prep steps and baking instructions…" },
              ]}
            />
          </Card>
        </div>
      </Section>

      <Section id="lists" title="Ingredients & steps" description="Checkable pantry list and numbered recipe timeline.">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padding="lg">
            <IngredientsList ingredients={ingredients} />
          </Card>
          <Card padding="lg">
            <SectionTitle
              title="Recipe steps"
              icon={<UtensilsCrossed className="h-5 w-5" />}
              action={<Badge tone="neutral" icon={<Timer className="h-3.5 w-3.5" />}>35 min</Badge>}
            />
            <StepsList
              className="mt-5"
              steps={recipeSteps}
              tip="Drain the mozzarella for 30 minutes before baking to keep the centre crust crisp."
            />
          </Card>
        </div>
      </Section>

      <Section id="skeletons" title="Skeletons" description="Loading placeholders for the analyzing screen.">
        <div className="grid gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard showMedia={false} lines={2} showPills={false} />
        </div>
      </Section>

      <Section id="empty-state" title="Empty state" description="Zero-detection fallback with capture guidance and sample dishes.">
        <EmptyState
          icon={UtensilsCrossed}
          eyebrow="Recognition unsuccessful"
          title="We couldn't find any food in this photo"
          description="FoodLens looks for edible ingredients, plated meals or fresh groceries. It looks like this photo might be a landscape, pet or household object."
          tips={[
            { title: "Centering:", text: "Ensure the food is well lit and centred in the frame." },
            { title: "Clarity:", text: "Avoid blurry shots, overhead shadows or excessive glare." },
            { title: "Proximity:", text: "Try zooming in directly onto the bowl or cutting board." },
          ]}
          action={
            <>
              <Button leftIcon={<ImageUp className="h-4 w-4" />}>Upload another photo</Button>
              <Button variant="secondary">Browse sample dishes</Button>
            </>
          }
          footer={
            <div className="flex flex-wrap items-center justify-center gap-2">
              {sampleDishes.map((dish) => (
                <span key={dish} className="rounded-pill bg-surface-lowest px-3 py-1.5 font-body text-label-sm text-muted shadow-sm">
                  {dish}
                </span>
              ))}
            </div>
          }
        />
      </Section>

      <Section id="error-state" title="Error state" description="Friendly failure card with diagnostics, retry and support paths.">
        <ErrorState
          details={[
            "[ERR_VISION_TIMEOUT]",
            "Endpoint: POST /api/v1/analyze",
            "Cluster: us-east-inference-04",
            "Latency: 30002ms (threshold: 25000ms)",
            "Trace-ID: fl_84920fe81c2049d9",
          ]}
          onRetry={() => showToast("info")}
          onBack={() => showToast("info")}
        />
      </Section>

      <Section id="overlays" title="Toast & confirmation" description="Transient notifications and destructive-action dialogs.">
        <Card padding="lg" className="flex flex-wrap items-center gap-3">
          <Button size="sm" variant="secondary" onClick={() => showToast("success")}>Success toast</Button>
          <Button size="sm" variant="secondary" onClick={() => showToast("warning")}>Warning toast</Button>
          <Button size="sm" variant="secondary" onClick={() => showToast("danger")}>Danger toast</Button>
          <Button size="sm" variant="secondary" onClick={() => showToast("info")}>Info toast</Button>
          <Button size="sm" variant="danger" onClick={() => setDialogOpen(true)}>Open confirm dialog</Button>
        </Card>
      </Section>

      <Toast
        open={toast.open}
        tone={toast.tone}
        title={toastCopy[toast.tone].title}
        description={toastCopy[toast.tone].description}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      />

      <ConfirmDialog
        open={dialogOpen}
        title="Delete this analysis?"
        description="Margherita Pizza will be removed from your history along with its generated recipe. This action can't be undone."
        onCancel={() => setDialogOpen(false)}
        onConfirm={() => {
          setDialogOpen(false);
          showToast("success");
        }}
      />
    </div>
  );
}
