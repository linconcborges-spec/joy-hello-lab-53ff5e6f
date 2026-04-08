import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStorage = () => {
  const [isUploading, setIsUploading] = useState(false);

  const uploadImage = async (file: File) => {
    try {
      setIsUploading(true);

      // Limpar o nome do arquivo para evitar problemas com caracteres especiais
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Tentar fazer o upload
      const { error: uploadError, data } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes('bucket not found')) {
          throw new Error("A pasta de imagens ainda não foi criada no banco de dados. Por favor, execute o comando SQL que te enviei.");
        }
        throw uploadError;
      }

      // Buscar a URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      toast.success("Imagem enviada com sucesso!");
      return publicUrl;
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast.error(error.message || "Erro ao enviar imagem");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadImage, isUploading };
};
