"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, MapPin, Clock, Eye, MessageCircle, Sparkles, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  price: number;
  image: string;
  category: string;
  location: string;
  timeAgo: string;
  views: number;
  isFeatured?: boolean;
  isNew?: boolean;
  isHot?: boolean;
  seller: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  onViewDetails?: () => void;
  onContact?: () => void;
  onFavorite?: () => void;
}

export function ProductCard({
  id,
  title,
  description,
  price,
  image,
  category,
  location,
  timeAgo,
  views,
  isFeatured = false,
  isNew = false,
  isHot = false,
  seller,
  onViewDetails,
  onContact,
  onFavorite,
}: ProductCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleFavorite = () => {
    setIsFavorited(!isFavorited);
    onFavorite?.();
  };

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-card border border-border/50",
        "transition-all duration-500 card-hover",
        isFeatured && "ring-2 ring-primary/30"
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={image || "/placeholder.svg"}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-700",
            isHovered && "scale-110"
          )}
        />
        
        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          {isFeatured && (
            <Badge className="bg-primary text-primary-foreground font-semibold">
              <Sparkles className="w-3 h-3 mr-1" />
              Featured
            </Badge>
          )}
          {isNew && (
            <Badge className="bg-emerald-500 text-white font-semibold">
              New
            </Badge>
          )}
          {isHot && (
            <Badge className="bg-red-500 text-white font-semibold animate-pulse">
              Hot
            </Badge>
          )}
        </div>

        {/* Favorite Button */}
        <motion.button
          className={cn(
            "absolute top-3 right-3 p-2.5 rounded-full",
            "bg-background/80 backdrop-blur-sm border border-border/50",
            "transition-all duration-300",
            isFavorited ? "text-red-500" : "text-muted-foreground hover:text-red-500"
          )}
          onClick={handleFavorite}
          whileTap={{ scale: 0.9 }}
        >
          <Heart className={cn("w-5 h-5", isFavorited && "fill-current")} />
        </motion.button>

        {/* Quick Action Buttons - Show on Hover */}
        <motion.div
          className="absolute bottom-3 left-3 right-3 flex gap-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onViewDetails}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="flex-1"
            onClick={onContact}
          >
            <MessageCircle className="w-4 h-4 mr-1" />
            Contact
          </Button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Category & Location */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Badge variant="outline" className="text-xs font-normal">
            {category}
          </Badge>
          <div className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {location}
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-lg text-foreground line-clamp-1 group-hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gradient">
            N${price.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">or trade</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {/* Seller Info */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image
                src={seller.avatar || "/placeholder.svg"}
                alt={seller.name}
                width={28}
                height={28}
                className="rounded-full border border-border"
              />
              {seller.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <span className="text-sm text-muted-foreground truncate max-w-[100px]">
              {seller.name}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              {views}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {timeAgo}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Arrow Indicator */}
      <motion.div
        className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-primary flex items-center justify-center"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isHovered ? 1 : 0, scale: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
      >
        <ArrowRight className="w-4 h-4 text-primary-foreground" />
      </motion.div>
    </motion.div>
  );
}
