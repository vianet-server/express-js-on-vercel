import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Image, Video } from 'lucide-react';

interface MediaSectionProps {
  onUpload?: () => void;
}

export function MediaSection({ onUpload }: MediaSectionProps) {
  return (
    <Card>
      <CardHeader><CardTitle>Media</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20">
              {i === 1 ? <Image size={24} /> : i === 2 ? <Video size={24} /> : <Image size={24} />}
              <span className="text-xs">{i === 1 ? 'Image' : i === 2 ? 'Video' : 'Image'}</span>
              <span className="text-[10px]">No media</span>
            </div>
          ))}
          <div
            className="aspect-video rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1.5 text-muted-foreground bg-muted/20 cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={onUpload}
          >
            <Upload size={24} />
            <span className="text-xs">Add Media</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
