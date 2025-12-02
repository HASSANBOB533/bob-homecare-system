import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../lib/trpc";
import { ImageUpload } from "../components/ImageUpload";
import { Button } from "../components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminServiceGallery() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const serviceId = parseInt(id || "0");

  const { data: service, isLoading } = trpc.pricing.getServiceById.useQuery(
    { serviceId },
    { enabled: !!serviceId }
  );

  const [galleryImages, setGalleryImages] = useState<string[]>(
    service?.galleryImages || []
  );

  const uploadImageMutation = trpc.services.uploadImage.useMutation();
  const updateGalleryMutation = trpc.services.updateGallery.useMutation();

  const handleUpload = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result as string;
          const result = await uploadImageMutation.mutateAsync({
            fileName: file.name,
            fileType: file.type,
            fileData: base64Data,
          });
          resolve(result.url);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSave = async () => {
    try {
      await updateGalleryMutation.mutateAsync({
        serviceId,
        galleryImages,
      });
      toast.success("Gallery images updated successfully!");
      setLocation("/admin/services");
    } catch (error) {
      console.error("Failed to update gallery:", error);
      toast.error("Failed to update gallery images");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">Service not found</p>
            <div className="flex justify-center mt-4">
              <Button onClick={() => setLocation("/admin/services")}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Services
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manage Gallery Images</h1>
          <p className="text-muted-foreground mt-1">
            {service.name} {service.nameEn && `/ ${service.nameEn}`}
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/admin/services")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Image Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Gallery Images</CardTitle>
          <CardDescription>
            Upload and manage images for this service. Images will be displayed in the service detail page gallery.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ImageUpload
            images={galleryImages}
            onImagesChange={setGalleryImages}
            maxImages={10}
            onUpload={handleUpload}
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => setLocation("/admin/services")}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={updateGalleryMutation.isPending}
        >
          <Save className="mr-2 h-4 w-4" />
          {updateGalleryMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
