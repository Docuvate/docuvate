//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'encoder_reindex_progress_dto.g.dart';

/// EncoderReindexProgressDto
///
/// Properties:
/// * [targetEncoderId] 
/// * [targetEncoderRevision] 
/// * [progressProcessed] - Documents already at the target encoder revision.
/// * [progressTotal] - Extracted ready documents in this tenant.
/// * [progressPending] - Documents still queued for background re-embedding.
@BuiltValue()
abstract class EncoderReindexProgressDto implements Built<EncoderReindexProgressDto, EncoderReindexProgressDtoBuilder> {
  @BuiltValueField(wireName: r'targetEncoderId')
  String get targetEncoderId;

  @BuiltValueField(wireName: r'targetEncoderRevision')
  String get targetEncoderRevision;

  /// Documents already at the target encoder revision.
  @BuiltValueField(wireName: r'progressProcessed')
  num get progressProcessed;

  /// Extracted ready documents in this tenant.
  @BuiltValueField(wireName: r'progressTotal')
  num get progressTotal;

  /// Documents still queued for background re-embedding.
  @BuiltValueField(wireName: r'progressPending')
  num get progressPending;

  EncoderReindexProgressDto._();

  factory EncoderReindexProgressDto([void updates(EncoderReindexProgressDtoBuilder b)]) = _$EncoderReindexProgressDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(EncoderReindexProgressDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<EncoderReindexProgressDto> get serializer => _$EncoderReindexProgressDtoSerializer();
}

class _$EncoderReindexProgressDtoSerializer implements PrimitiveSerializer<EncoderReindexProgressDto> {
  @override
  final Iterable<Type> types = const [EncoderReindexProgressDto, _$EncoderReindexProgressDto];

  @override
  final String wireName = r'EncoderReindexProgressDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    EncoderReindexProgressDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'targetEncoderId';
    yield serializers.serialize(
      object.targetEncoderId,
      specifiedType: const FullType(String),
    );
    yield r'targetEncoderRevision';
    yield serializers.serialize(
      object.targetEncoderRevision,
      specifiedType: const FullType(String),
    );
    yield r'progressProcessed';
    yield serializers.serialize(
      object.progressProcessed,
      specifiedType: const FullType(num),
    );
    yield r'progressTotal';
    yield serializers.serialize(
      object.progressTotal,
      specifiedType: const FullType(num),
    );
    yield r'progressPending';
    yield serializers.serialize(
      object.progressPending,
      specifiedType: const FullType(num),
    );
  }

  @override
  Object serialize(
    Serializers serializers,
    EncoderReindexProgressDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required EncoderReindexProgressDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'targetEncoderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.targetEncoderId = valueDes;
          break;
        case r'targetEncoderRevision':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.targetEncoderRevision = valueDes;
          break;
        case r'progressProcessed':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.progressProcessed = valueDes;
          break;
        case r'progressTotal':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.progressTotal = valueDes;
          break;
        case r'progressPending':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(num),
          ) as num;
          result.progressPending = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  EncoderReindexProgressDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = EncoderReindexProgressDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

