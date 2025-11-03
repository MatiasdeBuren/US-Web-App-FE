import { useState, useEffect } from 'react';
import { Star, MessageCircle } from 'lucide-react';
import { getAmenityRatings } from '../api_calls/ratings';
import type { AmenityRatingsResponse, Rating } from '../api_calls/ratings';
import AmenityRatingStats from './AmenityRatingStats';

interface AmenityReviewsProps {
    amenityId: number;
    amenityName: string;
}

const RATING_LABELS: Record<number, string> = {
    1: 'Malo',
    2: 'Bueno',
    3: 'Muy bueno'
};

const SUBCATEGORY_LABELS: Record<string, string> = {
    cleanliness: 'Limpieza',
    equipment: 'Equipamiento',
    comfort: 'Comodidad',
    compliance: 'Cumplimiento'
};

export default function AmenityReviews({ amenityId, amenityName }: AmenityReviewsProps) {
    const [data, setData] = useState<AmenityRatingsResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRatings();
    }, [amenityId]);

    const loadRatings = async () => {
        try {
            const response = await getAmenityRatings(amenityId);
            setData(response);
        } catch (error) {
            console.error('Error loading ratings:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    const renderRatingCard = (rating: Rating) => {
        const subcategories = [
            { key: 'cleanliness', value: rating.cleanliness },
            { key: 'equipment', value: rating.equipment },
            { key: 'comfort', value: rating.comfort },
            { key: 'compliance', value: rating.compliance }
        ].filter(sub => sub.value !== null);

        return (
            <div key={rating.id} className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                    <div>
                        <div className="font-semibold text-gray-800 mb-1">
                            {rating.user.name}
                        </div>
                        <div className="flex items-center gap-2">
                            {renderStars(rating.overallRating)}
                            <span className="text-sm font-medium text-gray-700">
                                {RATING_LABELS[rating.overallRating]}
                            </span>
                        </div>
                    </div>
                    <div className="text-xs text-gray-500">
                        {new Date(rating.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                        })}
                    </div>
                </div>

                {subcategories.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        {subcategories.map(sub => (
                            <div key={sub.key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                    {SUBCATEGORY_LABELS[sub.key]}
                                </span>
                                <div className="flex items-center gap-1">
                                    {renderStars(sub.value!)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {rating.comment && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                            <p className="text-sm text-gray-700">{rating.comment}</p>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    if (!data || data.ratings.length === 0) {
        return (
            <div className="text-center py-12">
                <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Sin reseñas aún</p>
                <p className="text-sm text-gray-500 mt-1">
                    Sé el primero en calificar {amenityName}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Reseñas de {amenityName}
                </h3>
                <AmenityRatingStats stats={data.stats} />
            </div>

            <div className="space-y-4">
                {data.ratings.map(renderRatingCard)}
            </div>
        </div>
    );
}
