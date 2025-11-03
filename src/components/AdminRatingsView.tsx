import { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Calendar, Filter } from 'lucide-react';
import { getAllRatings } from '../api_calls/ratings';
import type { Rating } from '../api_calls/ratings';

const SUBCATEGORY_LABELS: Record<string, string> = {
    cleanliness: 'Limpieza',
    equipment: 'Equipamiento',
    comfort: 'Comodidad',
    compliance: 'Cumplimiento'
};

export default function AdminRatingsView() {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | number>('all');
    const [amenityFilter, setAmenityFilter] = useState<string>('all');

    useEffect(() => {
        loadRatings();
    }, []);

    const loadRatings = async () => {
        try {
            setLoading(true);
            const data = await getAllRatings();
            setRatings(data);
        } catch (error) {
            console.error('Error loading ratings:', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 3 - fullStars - (hasHalfStar ? 1 : 0);

        return (
            <div className="flex gap-1">
                {[...Array(fullStars)].map((_, i) => (
                    <Star
                        key={`full-${i}`}
                        className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                ))}
                {hasHalfStar && (
                    <div className="relative w-4 h-4">
                        <Star className="w-4 h-4 text-gray-300 absolute" />
                        <div className="overflow-hidden w-2 absolute">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        </div>
                    </div>
                )}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star
                        key={`empty-${i}`}
                        className="w-4 h-4 text-gray-300"
                    />
                ))}
            </div>
        );
    };

    const uniqueAmenities = Array.from(new Set(ratings.map(r => r.amenity?.name || 'Sin Amenity'))).sort();

    const filteredRatings = ratings.filter(rating => {
        const matchesStarFilter = filter === 'all' || Math.round(rating.overallRating) === filter;
        const matchesAmenityFilter = amenityFilter === 'all' || rating.amenity?.name === amenityFilter;
        return matchesStarFilter && matchesAmenityFilter;
    });

    const stats = {
        total: ratings.length,
        averageRating: ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r.overallRating, 0) / ratings.length 
            : 0,
        byAmenity: uniqueAmenities.map(amenity => ({
            name: amenity,
            count: ratings.filter(r => r.amenity?.name === amenity).length,
            average: ratings.filter(r => r.amenity?.name === amenity).length > 0
                ? ratings.filter(r => r.amenity?.name === amenity).reduce((sum, r) => sum + r.overallRating, 0) / 
                  ratings.filter(r => r.amenity?.name === amenity).length
                : 0
        }))
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border-2 border-yellow-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="w-8 h-8 text-yellow-600 fill-yellow-600" />
                        <h3 className="text-lg font-bold text-gray-800">Total Reseñas</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">{stats.total}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-2">
                        <Star className="w-8 h-8 text-blue-600 fill-blue-600" />
                        <h3 className="text-lg font-bold text-gray-800">Promedio General</h3>
                    </div>
                    <div className="flex items-center gap-3">
                        <p className="text-4xl font-bold text-gray-800">
                            {stats.averageRating.toFixed(1)}
                        </p>
                        {renderStars(stats.averageRating)}
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                        <MessageSquare className="w-8 h-8 text-green-600" />
                        <h3 className="text-lg font-bold text-gray-800">Con Comentarios</h3>
                    </div>
                    <p className="text-4xl font-bold text-gray-800">
                        {ratings.filter(r => r.comment).length}
                    </p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                    <Filter className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-bold text-gray-800">Filtros</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por calificación
                        </label>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                    filter === 'all'
                                        ? 'bg-gray-800 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Todas
                            </button>
                            {[3, 2, 1].map(stars => (
                                <button
                                    key={stars}
                                    onClick={() => setFilter(stars)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                                        filter === stars
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {stars} <Star className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por Amenity
                        </label>
                        <select
                            value={amenityFilter}
                            onChange={(e) => setAmenityFilter(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                        >
                            <option value="all">Todas las amenities</option>
                            {uniqueAmenities.map(amenity => (
                                <option key={amenity} value={amenity}>
                                    {amenity}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-800">
                    Reseñas ({filteredRatings.length})
                </h3>

                {filteredRatings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No hay reseñas que coincidan con los filtros</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredRatings.map((rating) => (
                            <div
                                key={rating.id}
                                className="bg-white rounded-xl shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex items-center gap-2">
                                                <User className="w-5 h-5 text-gray-600" />
                                                <span className="font-semibold text-gray-800">
                                                    {rating.user?.name || 'Usuario'}
                                                </span>
                                            </div>
                                            <span className="text-gray-400">•</span>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm text-gray-600">
                                                    {new Date(rating.createdAt).toLocaleDateString('es-AR', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <span className="text-lg font-bold text-gray-800">
                                                {rating.amenity?.name || 'Sin Amenity'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            {renderStars(rating.overallRating)}
                                            <span className="text-lg font-bold text-gray-800">
                                                {rating.overallRating.toFixed(1)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                    {Object.entries({
                                        cleanliness: rating.cleanliness,
                                        equipment: rating.equipment,
                                        comfort: rating.comfort,
                                        compliance: rating.compliance
                                    }).map(([key, value]) => {
                                        if (!value) return null;
                                        return (
                                            <div key={key} className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-xs text-gray-600 mb-1">
                                                    {SUBCATEGORY_LABELS[key]}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {renderStars(value)}
                                                    <span className="text-sm font-semibold text-gray-700">
                                                        {value}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {rating.comment && (
                                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-300">
                                        <div className="flex items-start gap-2">
                                            <MessageSquare className="w-4 h-4 text-gray-500 flex-shrink-0 mt-1" />
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                {rating.comment}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                    Estadísticas por Amenity
                </h3>
                
                <div className="space-y-3">
                    {stats.byAmenity.map(amenity => (
                        <div
                            key={amenity.name}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex-1">
                                <p className="font-semibold text-gray-800">{amenity.name}</p>
                                <p className="text-sm text-gray-600">{amenity.count} reseñas</p>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                {renderStars(amenity.average)}
                                <span className="text-lg font-bold text-gray-800 w-12 text-right">
                                    {amenity.average.toFixed(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
