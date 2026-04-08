import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useStorage() {
  const uploadImage = async (file: File, bucket = "product-images") => {
    try {
      // 1. Criar um nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = fileName;

      // 2. Tentar fazer o upload
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        // Se o erro for que o bucket não existe, avisamos
        if (uploadError.message.includes("bucket not found")) {
            toast.error("Erro: O storage 'product-images' não foi criado no Supabase.");
            return null;
        }
        throw uploadError;
      }

      // 3. Pegar a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error("Erro ao fazer upload da imagem: " + (error.message || ""));
      return null;
    }
  };

  return { uploadImage };
}
