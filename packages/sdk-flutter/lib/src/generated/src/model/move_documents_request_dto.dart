//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'move_documents_request_dto.g.dart';

/// MoveDocumentsRequestDto
///
/// Properties:
/// * [documentIds] 
/// * [folderId] 
@BuiltValue()
abstract class MoveDocumentsRequestDto implements Built<MoveDocumentsRequestDto, MoveDocumentsRequestDtoBuilder> {
  @BuiltValueField(wireName: r'documentIds')
  BuiltList<String> get documentIds;

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  MoveDocumentsRequestDto._();

  factory MoveDocumentsRequestDto([void updates(MoveDocumentsRequestDtoBuilder b)]) = _$MoveDocumentsRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(MoveDocumentsRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<MoveDocumentsRequestDto> get serializer => _$MoveDocumentsRequestDtoSerializer();
}

class _$MoveDocumentsRequestDtoSerializer implements PrimitiveSerializer<MoveDocumentsRequestDto> {
  @override
  final Iterable<Type> types = const [MoveDocumentsRequestDto, _$MoveDocumentsRequestDto];

  @override
  final String wireName = r'MoveDocumentsRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    MoveDocumentsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    yield r'documentIds';
    yield serializers.serialize(
      object.documentIds,
      specifiedType: const FullType(BuiltList, [FullType(String)]),
    );
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    MoveDocumentsRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required MoveDocumentsRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'documentIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.documentIds.replace(valueDes);
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  MoveDocumentsRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = MoveDocumentsRequestDtoBuilder();
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

